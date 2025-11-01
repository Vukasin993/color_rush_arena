import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';

interface GameHeaderProps {
  timeLeft: number;
  score: number;
  totalTime: number;
  onPause?: () => void;
  pauseAdsWatched?: number;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  timeLeft,
  score,
  totalTime,
  onPause,
  pauseAdsWatched = 0
}) => {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  // Calculate progress as percentage of time remaining
  const progressPercentage = (timeLeft / totalTime) * 100;

  if (!fontsLoaded) return null;

  return (
    <View style={styles.gameHeader}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>Time</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
        </View>
        <Text style={styles.timerText}>{timeLeft}s</Text>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.scoreText}>{score}</Text>
      </View>

      {pauseAdsWatched === 1 ? null : onPause && (
        <TouchableOpacity
          style={styles.pauseButton}
          activeOpacity={0.8}
          onPress={onPause}
        >
          <LinearGradient
            colors={['rgba(255, 59, 48, 0.8)', 'rgba(255, 45, 85, 0.6)']}
            style={styles.pauseButtonGradient}
          >
            <Ionicons name="pause" size={16} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    marginBottom: 5,
  },
  progressBarContainer: {
    width: 120,
    marginBottom: 5,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00FFC6',
    borderRadius: 3,
  },
  timerText: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    textShadowColor: '#00FFC6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    marginBottom: 5,
  },
  scoreText: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFD60A',
    textShadowColor: '#FFD60A',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  pauseButton: {
    borderRadius: 20,
    marginLeft: 15,
    elevation: 4,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pauseButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
});