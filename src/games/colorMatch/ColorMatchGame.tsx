import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StatusBar,
  Vibration,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import { useGame } from '../../store/useGameStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

// Import components
import { GameStartScreen } from './components/GameStartScreen';
import { GameHeader } from './components/GameHeader';
import { WordDisplay } from './components/WordDisplay';
import { ColorButtons } from './components/ColorButtons';

type ColorMatchGameProps = NativeStackScreenProps<RootStackParamList, 'ColorMatchGame'>;

interface ColorData {
  name: string;
  value: string;
  textColor: string;
}

const ALL_COLORS = [
  { name: 'RED', value: '#FF3B30', textColor: '#FF6B6B' },
  { name: 'GREEN', value: '#00FF88', textColor: '#00FFC6' },
  { name: 'BLUE', value: '#007AFF', textColor: '#4FC3F7' },
  { name: 'YELLOW', value: '#FFD60A', textColor: '#FFE066' },
  { name: 'PURPLE', value: '#8E2DE2', textColor: '#B794F6' },
  { name: 'ORANGE', value: '#FF9500', textColor: '#FFB84D' },
  { name: 'PINK', value: '#FF2D92', textColor: '#FF69B4' },
  { name: 'CYAN', value: '#00C7BE', textColor: '#4FD1C7' },
];

const getColorsForLevel = (level: 'easy' | 'medium' | 'hard'): ColorData[] => {
  switch (level) {
    case 'easy':
      return ALL_COLORS.slice(0, 4); // 4 colors
    case 'medium':
      return ALL_COLORS.slice(0, 6); // 6 colors
    case 'hard':
      return ALL_COLORS; // 8 colors
    default:
      return ALL_COLORS.slice(0, 4);
  }
};

const GAME_DURATION = 30; // seconds

export const ColorMatchGame: React.FC<ColorMatchGameProps> = ({ navigation, route }) => {
  const { level = 'easy' } = route.params || {};
  const { currentGame, startGame, endGame, updateScore } = useGame();
  
  const COLORS = getColorsForLevel(level);
  const [currentWord, setCurrentWord] = useState<ColorData>(COLORS[0]);
  const [currentTextColor, setCurrentTextColor] = useState<string>(COLORS[1].value);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  
  // Use refs for timer to avoid stale closure issues
  const timeLeftRef = useRef(GAME_DURATION);
  const startTimeRef = useRef<number | null>(null);
  
  // Animation values
  const pulseAnimation = useSharedValue(1);
  const correctAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(1);
  const shakeAnimation = useSharedValue(0);

  // Generate new round
  const generateNewRound = useCallback(() => {
    const wordIndex = Math.floor(Math.random() * COLORS.length);
    const textColorIndex = Math.floor(Math.random() * COLORS.length);
    
    setCurrentWord(COLORS[wordIndex]);
    setCurrentTextColor(COLORS[textColorIndex].value);
  }, [COLORS]);

  // Score ref to track current score
  const scoreRef = useRef(0);

  // Game over handler
  const handleGameOver = useCallback(() => {
    const finalScore = scoreRef.current;
    endGame(finalScore);
    navigation.navigate('GameOverScreen', { 
      gameType: 'colorMatch',
      level,
      score: finalScore,
      xpEarned: finalScore * 10 + (finalScore > 20 ? 100 : 0)
    });
  }, [endGame, navigation, level]);

  // Start game
  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setTimeLeft(GAME_DURATION);
    timeLeftRef.current = GAME_DURATION;
    startTimeRef.current = Date.now();
    scoreRef.current = 0; // Reset score ref
    startGame('colorMatch', level);
    generateNewRound();
    
    // Start progress animation
    progressAnimation.value = withTiming(0, { duration: GAME_DURATION * 1000 });
  }, [startGame, level, generateNewRound, progressAnimation]);

  // Timer effect using real time calculation for accuracy
  useEffect(() => {
    if (gameStarted) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - (startTimeRef.current ?? 0)) / 1000;
        const remaining = Math.max(0, GAME_DURATION - Math.floor(elapsed));
        setTimeLeft(remaining);
        timeLeftRef.current = remaining;
        
        if (remaining <= 0) {
          handleGameOver();
        }
      }, 250); // update 4x per second for smoother display

      return () => clearInterval(interval);
    }
  }, [gameStarted, handleGameOver]);



  // Handle color button press
  const handleColorPress = useCallback((selectedColor: ColorData) => {
    if (!gameStarted || timeLeftRef.current <= 0) return;

    const isCorrect = selectedColor.name === currentWord.name;
    
    if (isCorrect) {
      // Correct answer
      updateScore(1);
      scoreRef.current = currentGame.score + 1;
      
      // Trigger correct animation
      correctAnimation.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
      
      // Pulse animation
      pulseAnimation.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      Vibration.vibrate(50);
      generateNewRound();
    } else {
      // Wrong answer
      updateScore(-1);
      scoreRef.current = currentGame.score - 1;
      
      // Shake animation
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withRepeat(withTiming(10, { duration: 50 }), 3, true),
        withTiming(0, { duration: 50 })
      );
      
      Vibration.vibrate([100, 50, 100]);
    }
  }, [gameStarted, currentWord.name, updateScore, generateNewRound, correctAnimation, pulseAnimation, shakeAnimation, currentGame.score]);

  // Animation styles
  const correctOverlayStyle = useAnimatedStyle(() => ({
    opacity: correctAnimation.value,
    backgroundColor: interpolateColor(
      correctAnimation.value,
      [0, 1],
      ['rgba(0, 255, 198, 0)', 'rgba(0, 255, 198, 0.3)']
    ),
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  if (!gameStarted) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
        <GameStartScreen
          level={level}
          colors={COLORS}
          onStartGame={handleStartGame}
          onGoBack={() => navigation.goBack()}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
      
      {/* Correct Answer Overlay */}
      <Animated.View style={[styles.correctOverlay, correctOverlayStyle]} />
      
      {/* Header with Timer and Score */}
      <GameHeader
        timeLeft={timeLeft}
        score={currentGame.score}
        progressAnimation={progressAnimation}
      />

      {/* Main Game Area */}
      <Animated.View style={[styles.gameArea, shakeStyle]}>
        <WordDisplay
          currentWord={currentWord}
          currentTextColor={currentTextColor}
          pulseAnimation={pulseAnimation}
        />

        <ColorButtons
          colors={COLORS}
          onColorPress={handleColorPress}
        />
      </Animated.View>

      {/* Pause Button */}
      <TouchableOpacity
        style={styles.pauseButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(142, 45, 226, 0.3)', 'rgba(74, 0, 224, 0.3)']}
          style={styles.pauseButtonGradient}
        >
          <Ionicons name="pause" size={20} color="#FFFFFF" />
          <Text style={styles.pauseButtonText}>Pause</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1B',
  },
  correctOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  pauseButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#8E2DE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pauseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.5)',
  },
  pauseButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});