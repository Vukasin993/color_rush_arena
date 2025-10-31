import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

// AdMob App ID
export const ADMOB_APP_ID = 'ca-app-pub-5126134005676463~7784244991';

// Ad Unit IDs
export const AD_UNIT_IDS = {
  // Banner Ad
  banner: 'ca-app-pub-5126134005676463/5883063864',
  
  // Interstitial Ad (end level)
  interstitial: 'ca-app-pub-5126134005676463/5555760802',
  
  // Rewarded Ad (watch to continue)
  rewarded: 'ca-app-pub-5126134005676463/3070850650',
};

// Test Ad Unit IDs (for development)
export const TEST_AD_UNIT_IDS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
};

// Use test ads in development, real ads in production
const __DEV__ = process.env.NODE_ENV === 'development';

export const getAdUnitId = (adType: 'banner' | 'interstitial' | 'rewarded'): string => {
  return __DEV__ ? TEST_AD_UNIT_IDS[adType] : AD_UNIT_IDS[adType];
};

// Initialize AdMob
export const initializeAdMob = async () => {
  try {
    await mobileAds().initialize();
    console.log('✅ AdMob initialized successfully');
    
    // Optional: Set request configuration
    await mobileAds().setRequestConfiguration({
      // Max Ad Content Rating
      maxAdContentRating: MaxAdContentRating.G,
      // Tag for under age of consent
      tagForUnderAgeOfConsent: false,
      // Test device IDs (add your test device IDs here)
      testDeviceIdentifiers: ['EMULATOR'],
    });
  } catch (error) {
    console.error('❌ AdMob initialization failed:', error);
  }
};

export default mobileAds;
