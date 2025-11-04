import React, { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/components/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NetworkProvider } from './src/context/NetworkContext';
import { NetworkGuard } from './src/components/NetworkGuard';
import { userService } from './src/firebase/userService';
import { useAuthStore } from './src/store/useAuthStore';
import { initializeAdMob } from './src/services/admob';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

Sentry.init({
  dsn: 'https://301d9dc9647b25e3723aed92b2c32d54@o4510153580150784.ingest.de.sentry.io/4510303416025168',
  
  // Environment configuration
  environment: __DEV__ ? 'development' : 'production',
  enabled: !__DEV__, // Only send errors in production
  
  // Release tracking
  release: Constants.expoConfig?.version || '1.0.0',
  dist: Constants.expoConfig?.android?.versionCode?.toString() || '1',

  // Adds more context data to events (IP address, cookies, user, etc.)
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay (only in production)
  replaysSessionSampleRate: __DEV__ ? 0 : 0.1,
  replaysOnErrorSampleRate: __DEV__ ? 0 : 1.0,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // Performance Monitoring
  tracesSampleRate: __DEV__ ? 0 : 0.2, // 20% of transactions in production
  
  // Filter out noisy errors
  beforeSend(event, hint) {
    // Filter out expo development errors
    if (__DEV__) return null;
    
    // Filter out network timeout errors (expected behavior)
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message).toLowerCase();
      if (message.includes('network') && message.includes('timeout')) {
        return null;
      }
    }
    
    return event;
  },

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function App() {
  const musicEnabled = useAuthStore((state) => state.musicEnabled);
  const soundRef = useRef<Audio.Sound | null>(null);
  const tracks = [
    require('./assets/sound/sound1.mp3'),
    require('./assets/sound/sound2.mp3'),
    require('./assets/sound/sound3.mp3'),
    require('./assets/sound/sound4.mp3'),
  ];
  const trackIndexRef = useRef(0);

  useEffect(() => {
    console.log('🚀 App initializing...');
    
    // Set Sentry context
    Sentry.setContext('device', {
      platform: 'mobile',
      type: 'game',
    });
    
    try {
      userService.initializeAuth();
      initializeAdMob();
      Sentry.addBreadcrumb({
        category: 'app',
        message: 'App initialized successfully',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { location: 'app_initialization' },
      });
      console.error('App initialization error:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function playTrack(index: number) {
      if (!musicEnabled) return;
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(tracks[index], { volume: 0.2 });
        soundRef.current = sound;
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!isMounted) return;
          if (status.isLoaded && status.didJustFinish) {
            // Play next track in loop
            trackIndexRef.current = (trackIndexRef.current + 1) % tracks.length;
            playTrack(trackIndexRef.current);
          }
        });
      } catch (e) {
        console.warn('Music playback error:', e);
      }
    }

    if (musicEnabled) {
      playTrack(trackIndexRef.current);
    } else {
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    }
    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [musicEnabled]);

  return (
    <ErrorBoundary>
      <NetworkProvider>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#0F0F1B" />
          <NetworkGuard
            onConnectionLost={() => {
              console.log('🔴 Game paused - No internet connection');
              // Muzika će nastaviti, ali igre će biti pauzirane preko modala
            }}
            onConnectionRestored={() => {
              console.log('🟢 Connection restored - Game can continue');
            }}
          >
            <AppNavigator />
          </NetworkGuard>
        </SafeAreaProvider>
      </NetworkProvider>
    </ErrorBoundary>
  );
});