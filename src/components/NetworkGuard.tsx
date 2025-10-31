import React, { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import { useNetwork } from '../context/NetworkContext';
import { NoInternetScreen } from '../screens/NoInternetScreen';
import NetInfo from '@react-native-community/netinfo';

interface NetworkGuardProps {
  children: React.ReactNode;
  onConnectionLost?: () => void;
  onConnectionRestored?: () => void;
}

export const NetworkGuard: React.FC<NetworkGuardProps> = ({
  children,
  onConnectionLost,
  onConnectionRestored,
}) => {
  const { isConnected, isInternetReachable } = useNetwork();
  const [showNoInternet, setShowNoInternet] = useState(false);
  const [wasConnected, setWasConnected] = useState(true);

  // Determine if we have a working internet connection
  const hasInternet = isConnected && (isInternetReachable === null || isInternetReachable === true);

  useEffect(() => {
    if (!hasInternet && wasConnected) {
      // Connection lost
      console.log('⚠️ Internet connection lost!');
      setShowNoInternet(true);
      onConnectionLost?.();
      setWasConnected(false);
    } else if (hasInternet && !wasConnected) {
      // Connection restored
      console.log('✅ Internet connection restored!');
      setShowNoInternet(false);
      onConnectionRestored?.();
      setWasConnected(true);
    }
  }, [hasInternet, wasConnected, onConnectionLost, onConnectionRestored]);

  const handleRetry = async () => {
    console.log('🔄 Retrying connection...');
    const state = await NetInfo.fetch();
    console.log('🌐 Connection state:', state);
    
    const connectionRestored = state.isConnected && (state.isInternetReachable === null || state.isInternetReachable === true);
    
    if (connectionRestored) {
      setShowNoInternet(false);
      setWasConnected(true);
      onConnectionRestored?.();
    }
  };

  return (
    <>
      {children}
      <Modal
        visible={showNoInternet}
        animationType="fade"
        statusBarTranslucent
        presentationStyle="fullScreen"
      >
        <NoInternetScreen onRetry={handleRetry} />
      </Modal>
    </>
  );
};
