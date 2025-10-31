import { useState, useEffect } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { getAdUnitId } from '../services/admob';

export const useInterstitialAd = () => {
  const [loaded, setLoaded] = useState(false);
  const [interstitial, setInterstitial] = useState<InterstitialAd | null>(null);

  useEffect(() => {
    const adUnitId = getAdUnitId('interstitial');
    const interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Event listeners
    const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('✅ Interstitial ad loaded');
      setLoaded(true);
    });

    const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('❌ Interstitial ad closed');
      setLoaded(false);
      // Reload ad for next time
      interstitialAd.load();
    });

    const unsubscribeFailed = interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error('❌ Interstitial ad failed to load:', error);
        setLoaded(false);
      }
    );

    // Load the ad
    interstitialAd.load();
    setInterstitial(interstitialAd);

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeFailed();
    };
  }, []);

  const showAd = async (): Promise<boolean> => {
    if (!interstitial || !loaded) {
      console.warn('⚠️ Interstitial ad not ready yet');
      return false;
    }

    try {
      await interstitial.show();
      return true;
    } catch (error) {
      console.error('❌ Error showing interstitial ad:', error);
      return false;
    }
  };

  return {
    loaded,
    showAd,
  };
};
