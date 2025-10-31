import { useState, useEffect, useRef } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { getAdUnitId } from '../services/admob';

export const useRewardedAd = () => {
  const [loaded, setLoaded] = useState(false);
  const [rewarded, setRewarded] = useState<RewardedAd | null>(null);
  const [earnedReward, setEarnedReward] = useState(false);
  const rewardPromiseRef = useRef<{
    resolve: (earned: boolean) => void;
    reject: (error: any) => void;
  } | null>(null);

  useEffect(() => {
    const adUnitId = getAdUnitId('rewarded');
    const rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Event listeners
    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('✅ Rewarded ad loaded');
      setLoaded(true);
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
      // Reload ad for next time
      rewardedAd.load();
    });

    const unsubscribeFailed = rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error('❌ Rewarded ad failed to load:', error);
        setLoaded(false);
      }
    );

    // Load the ad
    rewardedAd.load();
    setRewarded(rewardedAd);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeFailed();
    };
  }, []);

  const showAd = async (): Promise<boolean> => {
    if (!rewarded || !loaded) {
      console.warn('⚠️ Rewarded ad not ready yet');
      return false;
    }

    try {
      // Reset reward status before showing
      setEarnedReward(false);
      
      // Create promise that resolves when ad is closed or reward is earned
      const rewardPromise = new Promise<boolean>((resolve, reject) => {
        rewardPromiseRef.current = { resolve, reject };
      });
      
      // Show the ad
      await rewarded.show();
      
      // Wait for the ad to be closed or reward to be earned
      const earned = await rewardPromise;
      
      console.log(`🎬 Ad result: ${earned ? 'EARNED' : 'NOT EARNED'}`);
      return earned;
    } catch (error) {
      console.error('❌ Error showing rewarded ad:', error);
      setEarnedReward(false);
      
      // Clean up promise ref
      if (rewardPromiseRef.current) {
        rewardPromiseRef.current.resolve(false);
        rewardPromiseRef.current = null;
      }
      
      return false;
    }
  };

  return {
    loaded,
    showAd,
    earnedReward,
  };
};
