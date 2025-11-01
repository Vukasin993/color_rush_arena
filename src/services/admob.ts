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
// Note: Using TEST ads to avoid internal errors during development
// Change to false for production release
const USE_TEST_ADS = true; // Set to true for testing

export const getAdUnitId = (adType: 'banner' | 'interstitial' | 'rewarded'): string => {
  return USE_TEST_ADS ? TEST_AD_UNIT_IDS[adType] : AD_UNIT_IDS[adType];
};

// Track initialization status
let isAdMobInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Initialize AdMob
export const initializeAdMob = async (): Promise<void> => {
  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Return immediately if already initialized
  if (isAdMobInitialized) {
    return Promise.resolve();
  }
  
  initializationPromise = (async () => {
    try {
      console.log('🔄 Initializing AdMob...');
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
      
      isAdMobInitialized = true;
      console.log('✅ AdMob configuration set');
    } catch (error) {
      console.error('❌ AdMob initialization failed:', error);
      initializationPromise = null; // Allow retry
      throw error;
    }
  })();
  
  return initializationPromise;
};

// Check if AdMob is initialized
export const isAdMobReady = (): boolean => {
  return isAdMobInitialized;
};

export default mobileAds;
