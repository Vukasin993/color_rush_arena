import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Vibration,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
} from '@expo-google-fonts/orbitron';
import { useGame } from '../../store/useGameStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type ReactionGameProps = NativeStackScreenProps<RootStackParamList, 'ReactionGame'>;

interface GameColors {
  name: string;
  value: string;
  textColor: string;
}

interface ReactionResult {
  round: number;
  reactionTime: number;
  wasCorrect: boolean;
  targetColor: string;
}

const GAME_COLORS: GameColors[] = [
  { name: 'RED', value: '#FF3B30', textColor: '#FF6B6B' },
  { name: 'GREEN', value: '#00FF88', textColor: '#00FFC6' },
  { name: 'BLUE', value: '#007AFF', textColor: '#4FC3F7' },
  { name: 'YELLOW', value: '#FFD60A', textColor: '#FFE066' },
  { name: 'PURPLE', value: '#8E2DE2', textColor: '#B865F0' },
];

const TOTAL_ROUNDS = 5;
const MIN_WAIT_TIME = 1000; // 1 second
const MAX_WAIT_TIME = 2000; // 2 seconds
const PENALTY_MS = 100;

export const ReactionGame: React.FC<ReactionGameProps> = ({ navigation }) => {
  const { startGame, endGame, updateScore } = useGame();
  
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'target' | 'results'>('waiting');
  const [currentRound, setCurrentRound] = useState(1);
  const [targetColor, setTargetColor] = useState<GameColors>(GAME_COLORS[1]); // Default to GREEN
  const [currentBgColor, setCurrentBgColor] = useState('#0F0F1B');
  const [results, setResults] = useState<ReactionResult[]>([]);
  const [isWaitingForTarget, setIsWaitingForTarget] = useState(false);
  
  // Timing refs
  const targetShowTime = useRef<number>(0);
  const nextColorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Animation values
  const backgroundAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);
  const textGlowAnimation = useSharedValue(0);
  const resultAnimation = useSharedValue(0);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
  });

  // Cleanup timeouts
  const clearTimeouts = useCallback(() => {
    if (nextColorTimeout.current) {
      clearTimeout(nextColorTimeout.current);
    }
    if (targetTimeout.current) {
      clearTimeout(targetTimeout.current);
    }
  }, []);

  // Start a new round
  const startNewRound = useCallback(() => {
    if (currentRound > TOTAL_ROUNDS) {
      // Game finished
      setGamePhase('results');
      
      // Calculate average reaction time and score
      const validReactions = results.filter(r => r.wasCorrect);
      const avgReactionTime = validReactions.length > 0 
        ? validReactions.reduce((sum, r) => sum + r.reactionTime, 0) / validReactions.length 
        : 999;
      
      // Score based on reaction time (lower is better)
      const score = Math.max(0, Math.round(1000 - avgReactionTime));
      
      endGame(score);
      
      // Animate results
      resultAnimation.value = withTiming(1, { duration: 800 });
      
      return;
    }

    setGamePhase('waiting');
    setIsWaitingForTarget(true);
    
    // Random wait time before showing target
    const waitTime = Math.random() * (MAX_WAIT_TIME - MIN_WAIT_TIME) + MIN_WAIT_TIME;
    
    // Show random colors during wait
    const showRandomColors = () => {
      const randomColor = GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)];
      if (randomColor.name !== targetColor.name) {
        setCurrentBgColor(randomColor.value);
        backgroundAnimation.value = withTiming(1, { duration: 300 });
      }
    };

    // Start showing random colors
    const colorInterval = setInterval(showRandomColors, 400);
    
    nextColorTimeout.current = setTimeout(() => {
      clearInterval(colorInterval);
      
      // Show target color
      setCurrentBgColor(targetColor.value);
      setGamePhase('target');
      setIsWaitingForTarget(false);
      targetShowTime.current = Date.now();
      
      backgroundAnimation.value = withTiming(1, { duration: 200 });
      textGlowAnimation.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0.7, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      // Auto-advance if no tap (miss)
      targetTimeout.current = setTimeout(() => {
        // Handle miss inline to avoid circular dependency
        const newResult: ReactionResult = {
          round: currentRound,
          reactionTime: 999,
          wasCorrect: false,
          targetColor: targetColor.name,
        };
        
        setResults(prev => [...prev, newResult]);
        clearTimeouts();
        
        setTimeout(() => {
          setCurrentRound(prev => prev + 1);
          backgroundAnimation.value = withTiming(0, { duration: 300 });
          setTimeout(startNewRound, 300);
        }, 500);
      }, 3000);
    }, waitTime);
  }, [currentRound, results, targetColor, endGame, backgroundAnimation, textGlowAnimation, resultAnimation, clearTimeouts]);

  // Handle correct tap
  const handleTap = useCallback(() => {
    if (!gameStarted) return;
    
    if (gamePhase === 'target') {
      // Correct tap on target color
      const reactionTime = Date.now() - targetShowTime.current;
      
      const newResult: ReactionResult = {
        round: currentRound,
        reactionTime,
        wasCorrect: true,
        targetColor: targetColor.name,
      };
      
      setResults(prev => [...prev, newResult]);
      updateScore(1);
      
      // Success feedback
      pulseAnimation.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      Vibration.vibrate(50);
      clearTimeouts();
      
      // Next round after delay
      setTimeout(() => {
        setCurrentRound(prev => prev + 1);
        backgroundAnimation.value = withTiming(0, { duration: 300 });
        setTimeout(startNewRound, 300);
      }, 500);
      
    } else if (gamePhase === 'waiting' || isWaitingForTarget) {
      // Wrong tap (too early)
      const newResult: ReactionResult = {
        round: currentRound,
        reactionTime: 999 + PENALTY_MS,
        wasCorrect: false,
        targetColor: targetColor.name,
      };
      
      setResults(prev => [...prev, newResult]);
      updateScore(-1);
      
      // Error feedback
      pulseAnimation.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      Vibration.vibrate([100, 50, 100]);
    }
  }, [gameStarted, gamePhase, currentRound, targetColor, isWaitingForTarget, updateScore, clearTimeouts, pulseAnimation, startNewRound, backgroundAnimation]);

  // Start game
  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setCurrentRound(1);
    setResults([]);
    setGamePhase('waiting');
    
    // Pick random target color
    const randomTarget = GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)];
    setTargetColor(randomTarget);
    
    startGame('reactionTap');
    
    setTimeout(startNewRound, 1000);
  }, [startGame, startNewRound]);

  // Show results screen
  const showResults = useCallback(() => {
    const validReactions = results.filter(r => r.wasCorrect);
    const avgReactionTime = validReactions.length > 0 
      ? validReactions.reduce((sum, r) => sum + r.reactionTime, 0) / validReactions.length 
      : 999;
    
    const score = Math.max(0, Math.round(1000 - avgReactionTime));
    const xpEarned = score * 10 + (avgReactionTime < 300 ? 100 : 0);
    
    navigation.navigate('GameOverScreen', {
      gameType: 'reactionTap',
      score,
      xpEarned,
    });
  }, [results, navigation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Animation styles
  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        backgroundAnimation.value,
        [0, 1],
        ['#0F0F1B', currentBgColor]
      ),
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const textGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + (textGlowAnimation.value * 0.3),
    textShadowRadius: 15 + (textGlowAnimation.value * 10),
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultAnimation.value,
    transform: [{ translateY: (1 - resultAnimation.value) * 50 }],
  }));

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Start Screen
  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
          <Text style={styles.gameTitle}>⚡ Reaction Tap</Text>
          <Text style={styles.gameSubtitle}>Lightning Fast Reflexes</Text>
          
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to Play:</Text>
            <Text style={styles.instructionsText}>
              • Watch for the target color at the top{'\n'}
              • Screen will flash random colors{'\n'}
              • Tap ONLY when you see the target color{'\n'}
              • React as fast as possible!{'\n'}
              • 5 rounds total - get your best average time
            </Text>
          </View>

          <View style={styles.targetPreview}>
            <Text style={styles.previewLabel}>You&apos;ll be looking for:</Text>
            <View style={[styles.colorPreview, { backgroundColor: GAME_COLORS[1].value }]}>
              <Text style={[styles.previewColorText, { color: GAME_COLORS[1].textColor }]}>
                {GAME_COLORS[1].name}
              </Text>
            </View>
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
              <Text style={styles.startButtonText}>START REACTION TEST</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Results Screen
  if (gamePhase === 'results') {
    const validReactions = results.filter(r => r.wasCorrect);
    const avgReactionTime = validReactions.length > 0 
      ? validReactions.reduce((sum, r) => sum + r.reactionTime, 0) / validReactions.length 
      : 999;

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
        
        <Animated.View style={[styles.resultsContainer, resultStyle]}>
          <Text style={styles.resultsTitle}>⚡ Results</Text>
          
          <View style={styles.avgTimeContainer}>
            <Text style={styles.avgTimeLabel}>Average Reaction Time</Text>
            <Text style={styles.avgTimeValue}>
              {avgReactionTime < 999 ? `${Math.round(avgReactionTime)}ms` : 'N/A'}
            </Text>
            <Text style={styles.avgTimeRating}>
              {avgReactionTime < 200 ? 'LIGHTNING!' : 
               avgReactionTime < 300 ? 'EXCELLENT' :
               avgReactionTime < 400 ? 'GOOD' :
               avgReactionTime < 500 ? 'AVERAGE' : 'KEEP PRACTICING'}
            </Text>
          </View>

          <View style={styles.roundResults}>
            <Text style={styles.roundResultsTitle}>Round by Round</Text>
            {results.map((result, index) => (
              <View key={index} style={styles.roundResultItem}>
                <Text style={styles.roundNumber}>#{result.round}</Text>
                <Text style={[
                  styles.roundTime,
                  { color: result.wasCorrect ? '#00FFC6' : '#FF6B6B' }
                ]}>
                  {result.wasCorrect ? `${result.reactionTime}ms` : 'MISS'}
                </Text>
                <Text style={styles.roundStatus}>
                  {result.wasCorrect ? '✅' : '❌'}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={showResults}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD60A', '#FFB800']}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>VIEW RESULTS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Game Screen
  return (
    <Pressable style={styles.gameContainer} onPress={handleTap}>
      <StatusBar barStyle="light-content" backgroundColor={currentBgColor} />
      
      <Animated.View style={[styles.gameBackground, backgroundStyle]}>
        {/* Header with target color and round info */}
        <View style={styles.gameHeader}>
          <Animated.View style={[styles.targetInstruction, pulseStyle]}>
            <Animated.Text style={[styles.targetText, textGlowStyle]}>
              TAP WHEN SCREEN TURNS
            </Animated.Text>
            <Animated.Text style={[
              styles.targetColorText,
              textGlowStyle,
              { color: targetColor.textColor }
            ]}>
              {targetColor.name}
            </Animated.Text>
          </Animated.View>
          
          <View style={styles.roundInfo}>
            <Text style={styles.roundText}>Round {currentRound}/{TOTAL_ROUNDS}</Text>
          </View>
        </View>

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {gamePhase === 'waiting' ? 'GET READY...' : 
             gamePhase === 'target' ? 'TAP NOW!' : ''}
          </Text>
        </View>

        {/* Tap area instruction */}
        <View style={styles.tapInstruction}>
          <Text style={styles.tapText}>TAP ANYWHERE</Text>
        </View>
      </Animated.View>
    </Pressable>
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
  gameContainer: {
    flex: 1,
  },
  gameBackground: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
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
    fontFamily: 'Orbitron_900Black',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#FFD60A',
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
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 20,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFD60A',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: '#FFD60A',
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
  targetPreview: {
    alignItems: 'center',
    marginBottom: 40,
  },
  previewLabel: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    marginBottom: 15,
  },
  colorPreview: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00FF88',
  },
  previewColorText: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameHeader: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  targetInstruction: {
    alignItems: 'center',
    marginBottom: 20,
  },
  targetText: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#FFFFFF',
  },
  targetColorText: {
    fontSize: 36,
    fontFamily: 'Orbitron_900Black',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: 2,
  },
  roundInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  roundText: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 32,
    fontFamily: 'Orbitron_900Black',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tapInstruction: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  tapText: {
    fontSize: 18,
    fontFamily: 'Orbitron_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  resultsTitle: {
    fontSize: 40,
    fontFamily: 'Orbitron_900Black',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: '#FFD60A',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  avgTimeContainer: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  avgTimeLabel: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    marginBottom: 10,
  },
  avgTimeValue: {
    fontSize: 48,
    fontFamily: 'Orbitron_900Black',
    color: '#FFD60A',
    marginBottom: 10,
    textShadowColor: '#FFD60A',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  avgTimeRating: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    textShadowColor: '#00FFC6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  roundResults: {
    marginBottom: 40,
  },
  roundResultsTitle: {
    fontSize: 20,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  roundResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  roundNumber: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#B8B8D1',
    flex: 1,
  },
  roundTime: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    flex: 2,
    textAlign: 'center',
  },
  roundStatus: {
    fontSize: 20,
    flex: 1,
    textAlign: 'right',
  },
  continueButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  continueButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});