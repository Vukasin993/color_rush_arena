import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';

interface NoInternetScreenProps {
  onRetry?: () => void;
}

export const NoInternetScreen: React.FC<NoInternetScreenProps> = ({ onRetry }) => {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0F0F1B', '#1A1A2E', '#16213E']}
        style={styles.background}
      />

      <ScrollView style={styles.content} contentContainerStyle={{justifyContent: 'center', alignItems: 'center' }}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-offline" size={120} color="#FF6B6B" />
        </View>

        {/* Title */}
        <Text style={styles.title}>No Internet Connection</Text>

        {/* Description */}
        <Text style={styles.description}>
          Please check your internet connection and try again. Color Rush Arena requires an active internet connection to play.
        </Text>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Quick Tips:</Text>
          <Text style={styles.tipText}>• Check if WiFi is enabled</Text>
          <Text style={styles.tipText}>• Check if mobile data is enabled</Text>
          <Text style={styles.tipText}>• Try turning airplane mode off</Text>
          <Text style={styles.tipText}>• Move to an area with better signal</Text>
        </View>

        {/* Retry Button */}
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <LinearGradient
              colors={['#8E2DE2', '#4A00E0']}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh" size={24} color="#FFFFFF" style={styles.retryIcon} />
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1B',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 30,
    opacity: 0.9,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Orbitron_700Bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#FF6B6B',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  tipsContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#8E2DE2',
    marginBottom: 15,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
    marginBottom: 8,
    paddingLeft: 10,
  },
  retryButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#8E2DE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    width: '100%',
    marginBottom: 30,
  },
  retryButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  retryIcon: {
    marginRight: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
