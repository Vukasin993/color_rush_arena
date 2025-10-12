import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';

interface GameHeaderProps {
  timeLeft: number;
  score: number;
  progressAnimation: any;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  timeLeft,
  score,
  progressAnimation,
}) => {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value * 100}%`,
  }));

  if (!fontsLoaded) return null;

  return (
    <View style={styles.gameHeader}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>Time</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>
        </View>
        <Text style={styles.timerText}>{timeLeft}s</Text>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
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
});