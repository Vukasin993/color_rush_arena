import React, { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/components/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { userService } from './src/firebase/userService';
import { useAuthStore } from './src/store/useAuthStore';

export default function App() {
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
    userService.initializeAuth();
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
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0F0F1B" />
        <AppNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

