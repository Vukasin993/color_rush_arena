import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { getAdUnitId, initializeAdMob } from '../services/admob';
import * as Sentry from '@sentry/react-native';

export const useRewardedAd = () => {
  const [loaded, setLoaded] = useState(false);
  const [rewarded, setRewarded] = useState<RewardedAd | null>(null);
  const [earnedReward, setEarnedReward] = useState(false);
  const rewardPromiseRef = useRef<{
    resolve: (earned: boolean) => void;
    reject: (error: any) => void;
  } | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 2; // Reduced retries
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const adUnitId = getAdUnitId('rewarded');
    const rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Event listeners
    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      if (__DEV__) {
        console.log('✅ Rewarded ad ready');
      }
      setLoaded(true);
      isLoadingRef.current = false;
      retryCountRef.current = 0; // Reset retry counter on success
    });

    const unsubscribeEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('🎁 User earned reward:', reward);
        setEarnedReward(true);
        
        // Resolve promise if waiting
        if (rewardPromiseRef.current) {
          rewardPromiseRef.current.resolve(true);
          rewardPromiseRef.current = null;
        }
      }
    );

    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('❌ Rewarded ad closed');
      
      // Resolve promise with false if user closed without earning
      if (rewardPromiseRef.current) {
        rewardPromiseRef.current.resolve(false);
        rewardPromiseRef.current = null;
      }
      
      setLoaded(false);
      // Reload ad for next time (with longer delay to avoid internal error)
      setTimeout(() => {
        console.log('🔄 Reloading rewarded ad after close...');
        rewardedAd.load();
      }, 3000); // Increased from 1s to 3s
    });

    const unsubscribeFailed = rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        if (__DEV__) {
          console.warn('⚠️ Rewarded ad load failed:', error.message || error);
        }
        
        // Track broadcast delivery errors specifically
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('RemoteServiceException') || errorMessage.includes('broadcast')) {
          Sentry.captureException(new Error('AdMob Broadcast Delivery Failed'), {
            level: 'warning',
            tags: { ad_type: 'rewarded', error_type: 'broadcast' },
            extra: { 
              error: errorMessage,
              appState: appStateRef.current,
              retryCount: retryCountRef.current 
            },
          });
        }
        
        setLoaded(false);
        isLoadingRef.current = false;
        
        // Only retry if app is in foreground
        if (appStateRef.current !== 'active') {
          if (__DEV__) {
            console.log('⏸️ App not active - skipping retry');
          }
          return;
        }
        
        // Retry loading after error with exponential backoff
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const delay = Math.min(5000 * Math.pow(2, retryCountRef.current), 40000);
          
          if (__DEV__) {
            console.log(`🔄 Retry ${retryCountRef.current}/${maxRetries} in ${delay / 1000}s...`);
          }
          
          setTimeout(() => {
            if (appStateRef.current === 'active' && !isLoadingRef.current) {
              isLoadingRef.current = true;
              try {
                rewardedAd.load();
              } catch (err) {
                if (__DEV__) {
                  console.error('Load error:', err);
                }
                isLoadingRef.current = false;
              }
            }
          }, delay);
        } else {
          if (__DEV__) {
            console.log('⏸️ Max retries - pausing 60s');
          }
          setTimeout(() => {
            if (appStateRef.current === 'active' && !isLoadingRef.current) {
              retryCountRef.current = 0;
              isLoadingRef.current = true;
              try {
                rewardedAd.load();
              } catch (err) {
                if (__DEV__) {
                  console.error('Load error:', err);
                }
                isLoadingRef.current = false;
              }
            }
          }, 60000);
        }
      }
    );

    // AppState listener to track foreground/background
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
      
      if (__DEV__) {
        console.log('📱 AppState:', nextAppState);
      }
    });

    // Load the ad after ensuring AdMob is initialized
    (async () => {
      try {
        await initializeAdMob();
        // Wait additional time after initialization for better stability
        setTimeout(() => {
          if (appStateRef.current === 'active' && !isLoadingRef.current) {
            isLoadingRef.current = true;
            try {
              rewardedAd.load();
            } catch (err) {
              if (__DEV__) {
                console.error('Initial load error:', err);
              }
              isLoadingRef.current = false;
            }
          }
        }, 3000);
      } catch (error) {
        if (__DEV__) {
          console.error('❌ AdMob init failed:', error);
        }
        Sentry.captureException(error, {
          tags: { context: 'admob_init', ad_type: 'rewarded' },
        });
      }
    })();
    
    setRewarded(rewardedAd);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeFailed();
      appStateSubscription?.remove();
    };
  }, []);

  const showAd = async (): Promise<boolean> => {
    // Check if app is in foreground
    if (appStateRef.current !== 'active') {
      if (__DEV__) {
        console.warn('⚠️ App not in foreground - cannot show ad');
      }
      return false;
    }

    if (!rewarded || !loaded) {
      if (__DEV__) {
        console.warn('⚠️ Ad not ready');
      }
      return false;
    }

    try {
      // Reset reward status before showing
      setEarnedReward(false);
      
      // Create promise that resolves when ad is closed or reward is earned
      const rewardPromise = new Promise<boolean>((resolve, reject) => {
        rewardPromiseRef.current = { resolve, reject };
        
        // Timeout after 60s to prevent hanging
        setTimeout(() => {
          if (rewardPromiseRef.current) {
            if (__DEV__) {
              console.warn('⏱️ Ad show timeout');
            }
            rewardPromiseRef.current.resolve(false);
            rewardPromiseRef.current = null;
          }
        }, 60000);
      });
      
      // Show the ad with try-catch
      try {
        await rewarded.show();
      } catch (showError) {
        if (__DEV__) {
          console.error('❌ Show error:', showError);
        }
        
        // Track broadcast errors
        const errorMessage = (showError as any)?.message || String(showError);
        if (errorMessage.includes('RemoteServiceException') || errorMessage.includes('broadcast')) {
          Sentry.captureException(new Error('AdMob Show Broadcast Failed'), {
            level: 'warning',
            tags: { ad_type: 'rewarded', error_type: 'broadcast_show' },
            extra: { error: errorMessage, appState: appStateRef.current },
          });
        }
        
        // Clean up and return false
        if (rewardPromiseRef.current) {
          rewardPromiseRef.current.resolve(false);
          rewardPromiseRef.current = null;
        }
        return false;
      }
      
      // Wait for the ad to be closed or reward to be earned
      const earned = await rewardPromise;
      
      if (__DEV__) {
        console.log(`🎬 ${earned ? '✅ Earned' : '❌ Skipped'}`);
      }
      return earned;
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Unexpected error:', error);
      }
      setEarnedReward(false);
      
      // Clean up promise ref
      if (rewardPromiseRef.current) {
        rewardPromiseRef.current.resolve(false);
        rewardPromiseRef.current = null;
      }
      
      Sentry.captureException(error, {
        tags: { context: 'rewarded_ad_show' },
        extra: { appState: appStateRef.current },
      });
      
      return false;
    }
  };

  return {
    loaded,
    showAd,
    earnedReward,
  };
};
