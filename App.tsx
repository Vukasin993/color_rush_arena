import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/components/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { userService } from './src/firebase/userService';

export default function App() {
  useEffect(() => {
    console.log('🚀 App initializing...');
    // Initialize Firebase Auth listener
    userService.initializeAuth();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0F0F1B" />
        <AppNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

