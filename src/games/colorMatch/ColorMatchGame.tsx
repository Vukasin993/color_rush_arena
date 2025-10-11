import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Vibration,
} from 'react-native';
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
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import { useGame } from '../../store/useGameStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type ColorMatchGameProps = NativeStackScreenProps<RootStackParamList, 'ColorMatchGame'>;

interface ColorData {
  name: string;
  value: string;
  textColor: string;
}

const COLORS = [
  { name: 'RED', value: '#FF3B30', textColor: '#FF6B6B' },
  { name: 'GREEN', value: '#00FF88', textColor: '#00FFC6' },
  { name: 'BLUE', value: '#007AFF', textColor: '#4FC3F7' },
  { name: 'YELLOW', value: '#FFD60A', textColor: '#FFE066' },
];

const GAME_DURATION = 30; // seconds

export const ColorMatchGame: React.FC<ColorMatchGameProps> = ({ navigation }) => {
  const { currentGame, startGame, endGame, updateScore, updateTimer } = useGame();
  
  const [currentWord, setCurrentWord] = useState<ColorData>(COLORS[0]);
  const [currentTextColor, setCurrentTextColor] = useState<string>(COLORS[1].value);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  
  // Animation values
  const pulseAnimation = useSharedValue(1);
  const correctAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(1);
  const shakeAnimation = useSharedValue(0);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  // Generate new round
  const generateNewRound = useCallback(() => {
    const wordIndex = Math.floor(Math.random() * COLORS.length);
    const textColorIndex = Math.floor(Math.random() * COLORS.length);
    
    setCurrentWord(COLORS[wordIndex]);
    setCurrentTextColor(COLORS[textColorIndex].value);
  }, []);

  // Start game
  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setTimeLeft(GAME_DURATION);
    startGame('colorMatch');
    generateNewRound();
    
    // Start progress animation
    progressAnimation.value = withTiming(0, { duration: GAME_DURATION * 1000 });
  }, [startGame, generateNewRound, progressAnimation]);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (gameStarted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          updateTimer(newTime);
          
          if (newTime <= 0) {
            // Game over
            endGame(currentGame.score);
            navigation.navigate('GameOverScreen', { 
              gameType: 'colorMatch',
              score: currentGame.score,
              xpEarned: currentGame.score * 10 + (currentGame.score > 20 ? 100 : 0)
            });
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStarted, timeLeft, updateTimer, endGame, currentGame.score, navigation]);

  // Handle color button press
  const handleColorPress = useCallback((selectedColor: ColorData) => {
    if (!gameStarted || timeLeft <= 0) return;

    const isCorrect = selectedColor.name === currentWord.name;
    
    if (isCorrect) {
      // Correct answer
      updateScore(1);
      
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
      
      // Shake animation
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withRepeat(withTiming(10, { duration: 50 }), 3, true),
        withTiming(0, { duration: 50 })
      );
      
      Vibration.vibrate([100, 50, 100]);
    }
  }, [gameStarted, timeLeft, currentWord.name, updateScore, generateNewRound, correctAnimation, pulseAnimation, shakeAnimation]);

  // Animation styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const correctOverlayStyle = useAnimatedStyle(() => ({
    opacity: correctAnimation.value,
    backgroundColor: interpolateColor(
      correctAnimation.value,
      [0, 1],
      ['rgba(0, 255, 198, 0)', 'rgba(0, 255, 198, 0.3)']
    ),
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value * 100}%`,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!gameStarted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8E2DE2', '#4A00E0']}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.startContainer}>
          <Text style={styles.gameTitle}>🎨 Color Match</Text>
          <Text style={styles.gameSubtitle}>Test Your Focus</Text>
          
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to Play:</Text>
            <Text style={styles.instructionsText}>
              • A color word will appear in a different color{'\n'}
              • Tap the button matching the WORD, not the text color{'\n'}
              • Correct answer: +1 point{'\n'}
              • Wrong answer: -1 point{'\n'}
              • You have 30 seconds!
            </Text>
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartGame}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00FFC6', '#00D4AA']}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>START GAME</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
      
      {/* Correct Answer Overlay */}
      <Animated.View style={[styles.correctOverlay, correctOverlayStyle]} />
      
      {/* Header with Timer and Score */}
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
          <Text style={styles.scoreText}>{currentGame.score}</Text>
        </View>
      </View>

      {/* Main Game Area */}
      <Animated.View style={[styles.gameArea, shakeStyle]}>
        <View style={styles.wordContainer}>
          <Text style={styles.instructionText}>What COLOR is this WORD?</Text>
          <Animated.View style={pulseStyle}>
            <Text
              style={[
                styles.colorWord,
                { color: currentTextColor }
              ]}
            >
              {currentWord.name}
            </Text>
          </Animated.View>
        </View>

        {/* Color Buttons */}
        <View style={styles.buttonsContainer}>
          {COLORS.map((color, index) => (
            <TouchableOpacity
              key={color.name}
              style={[styles.colorButton, { borderColor: color.value }]}
              onPress={() => handleColorPress(color)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[`${color.value}20`, `${color.value}10`]}
                style={styles.colorButtonGradient}
              >
                <View
                  style={[
                    styles.colorButtonInner,
                    { backgroundColor: color.value }
                  ]}
                />
                <Text style={[styles.colorButtonText, { color: color.textColor }]}>
                  {color.name}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E2DE2',
    fontSize: 18,
    fontFamily: 'Orbitron_400Regular',
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1001,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#8E2DE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  backButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameTitle: {
    fontSize: 40,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#8E2DE2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  gameSubtitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    marginBottom: 40,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 20,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: '#00FFC6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  instructionsText: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'left',
  },
  startButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#00FFC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  startButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 20,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
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
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    marginBottom: 20,
  },
  colorWord: {
    fontSize: 48,
    fontFamily: 'Orbitron_700Bold',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  colorButton: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 15,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  colorButtonGradient: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 13,
  },
  colorButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  colorButtonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  pauseButton: {
    position: 'absolute',
    bottom: 40,
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
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
  },
});