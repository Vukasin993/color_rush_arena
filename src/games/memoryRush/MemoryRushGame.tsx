import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Vibration,

  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
} from '@expo-google-fonts/orbitron';
import { useGame } from '../../store/useGameStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { ColorGrid } from './components/ColorGrid';
import { SequenceDisplay } from './components/SequenceDisplay';
import { GameOverModal } from './components/GameOverModal';

type MemoryRushGameProps = NativeStackScreenProps<RootStackParamList, 'MemoryRushGame'>;

export interface GameColor {
  id: string;
  color: string;
  name: string;
  sound?: string;
}

export interface LevelConfig {
  name: string;
  startSequenceLength: number;
  maxSequenceLength: number;
  displaySpeed: number; // ms per color
  colorCount: number;
  gridSize: { rows: number; cols: number };
  scoreMultiplier: number;
  description: string;
}

const GAME_COLORS: GameColor[] = [
  { id: '1', color: '#FF6B6B', name: 'Red' },
  { id: '2', color: '#4ECDC4', name: 'Teal' },
  { id: '3', color: '#45B7D1', name: 'Blue' },
  { id: '4', color: '#96CEB4', name: 'Green' },
  { id: '5', color: '#FECA57', name: 'Yellow' },
  { id: '6', color: '#FF9FF3', name: 'Pink' },
  { id: '7', color: '#54A0FF', name: 'Light Blue' },
  { id: '8', color: '#5F27CD', name: 'Purple' },
];

const LEVEL_CONFIGS: Record<string, LevelConfig> = {
  easy: {
    name: 'Easy',
    startSequenceLength: 2,
    maxSequenceLength: 5,
    displaySpeed: 800,
    colorCount: 4,
    gridSize: { rows: 2, cols: 2 },
    scoreMultiplier: 1,
    description: 'Perfect for beginners - 4 colors, slow pace',
  },
  medium: {
    name: 'Medium',
    startSequenceLength: 3,
    maxSequenceLength: 7,
    displaySpeed: 650,
    colorCount: 6,
    gridSize: { rows: 2, cols: 3 },
    scoreMultiplier: 1.5,
    description: 'Getting challenging - 6 colors, medium pace',
  },
  hard: {
    name: 'Hard',
    startSequenceLength: 4,
    maxSequenceLength: 9,
    displaySpeed: 500,
    colorCount: 6,
    gridSize: { rows: 2, cols: 3 },
    scoreMultiplier: 2,
    description: 'For experts - faster pace, longer sequences',
  },
  extreme: {
    name: 'Extreme',
    startSequenceLength: 5,
    maxSequenceLength: 11,
    displaySpeed: 450,
    colorCount: 8,
    gridSize: { rows: 3, cols: 3 },
    scoreMultiplier: 2.5,
    description: 'Ultimate challenge - 8 colors, very fast',
  },
  'extra-hard': {
    name: 'Extra Hard',
    startSequenceLength: 6,
    maxSequenceLength: 13,
    displaySpeed: 400,
    colorCount: 8,
    gridSize: { rows: 3, cols: 3 },
    scoreMultiplier: 3,
    description: 'Insane difficulty - lightning fast sequences',
  },
};

interface GameState {
  sequence: string[];
  playerInput: string[];
  currentRound: number;
  score: number;
  gameOver: boolean;
  showingSequence: boolean;
  waitingForInput: boolean;
  currentSequenceIndex: number;
}



export const MemoryRushGame: React.FC<MemoryRushGameProps> = ({ navigation, route }) => {
  const { level = 'easy', autoStart = false } = route.params || {};
  const { startGame, endGame, updateScore } = useGame();
  const levelConfig = LEVEL_CONFIGS[level];
  const gameColors = GAME_COLORS.slice(0, levelConfig.colorCount);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    sequence: [],
    playerInput: [],
    currentRound: 1,
    score: 0,
    gameOver: false,
    showingSequence: false,
    waitingForInput: false,
    currentSequenceIndex: -1,
  });

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const sequenceTimeoutRef = useRef<number | null>(null);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
  });

  // Generate new sequence for current round
  const generateSequence = useCallback((round: number): string[] => {
    const sequenceLength = Math.min(
      levelConfig.startSequenceLength + round - 1,
      levelConfig.maxSequenceLength
    );
    
    const sequence: string[] = [];
    for (let i = 0; i < sequenceLength; i++) {
      const randomColor = gameColors[Math.floor(Math.random() * gameColors.length)];
      sequence.push(randomColor.id);
    }
    return sequence;
  }, [levelConfig, gameColors]);

  // Display sequence to player
  const displaySequence = useCallback((sequence: string[]) => {
    console.log('displaySequence called with:', sequence);
    setGameState(prev => ({
      ...prev,
      showingSequence: true,
      waitingForInput: false,
      currentSequenceIndex: -1,
    }));

    let index = 0;
    const showNextColor = () => {
      console.log('showNextColor, index:', index, 'sequence.length:', sequence.length);
      if (index < sequence.length) {
        setGameState(prev => ({
          ...prev,
          currentSequenceIndex: index,
        }));

        sequenceTimeoutRef.current = setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            currentSequenceIndex: -1, // Hide color
          }));
          
          setTimeout(() => {
            index++;
            if (index < sequence.length) {
              showNextColor();
            } else {
              // Sequence finished, wait for player input after a short delay
              console.log('Sequence finished, enabling input');
              setGameState(prev => ({
                ...prev,
                showingSequence: false,
                waitingForInput: true,
                currentSequenceIndex: -1,
              }));
            }
          }, 200); // Short pause between colors
        }, levelConfig.displaySpeed);
      }
    };

    // Start showing sequence after a brief delay
    setTimeout(() => {
      showNextColor();
    }, 500);
  }, [levelConfig.displaySpeed]);

  // Handle player color selection
  const handleColorPress = useCallback((colorId: string) => {
    console.log('handleColorPress called:', colorId, 'waitingForInput:', gameState.waitingForInput, 'gameOver:', gameState.gameOver);
    if (!gameState.waitingForInput || gameState.gameOver) return;

    Vibration.vibrate(30);

    setGameState(prev => {
      const newPlayerInput = [...prev.playerInput, colorId];
      const currentIndex = newPlayerInput.length - 1;
      
      // Check if current input is correct
      if (prev.sequence[currentIndex] !== colorId) {
        // Wrong color - game over
        Vibration.vibrate([200, 100, 200]);
        
        // Shake animation
        Animated.sequence([
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        return {
          ...prev,
          gameOver: true,
          waitingForInput: false,
        };
      }

      // Correct color
      if (newPlayerInput.length === prev.sequence.length) {
        // Round completed successfully
        const roundScore = prev.sequence.length * Math.round(levelConfig.scoreMultiplier);
        const newScore = prev.score + roundScore;
        
        // Update score in store
        setTimeout(() => {
          updateScore(roundScore);
        }, 0);

        // Check if reached max sequence length
        if (prev.sequence.length >= levelConfig.maxSequenceLength) {
          // Game completed - player won!
          return {
            ...prev,
            score: newScore,
            gameOver: true,
            waitingForInput: false,
          };
        }

        // Move to next round
        const nextRound = prev.currentRound + 1;
        const newSequence = generateSequence(nextRound);
        
        // Start next round after a short delay
        setTimeout(() => {
          displaySequence(newSequence);
        }, 1000);

        return {
          ...prev,
          playerInput: [],
          currentRound: nextRound,
          score: newScore,
          sequence: newSequence,
          waitingForInput: false,
        };
      }

      // Continue with current round
      return {
        ...prev,
        playerInput: newPlayerInput,
      };
    });
  }, [gameState.waitingForInput, gameState.gameOver, levelConfig.scoreMultiplier, levelConfig.maxSequenceLength, updateScore, generateSequence, displaySequence, shakeAnimation]);

  // Start new game
  const handleStartGame = useCallback(() => {
    const initialSequence = generateSequence(1);
    
    setGameStarted(true);
    setGameState({
      sequence: initialSequence,
      playerInput: [],
      currentRound: 1,
      score: 0,
      gameOver: false,
      showingSequence: false,
      waitingForInput: false,
      currentSequenceIndex: -1,
    });

    startGame('memoryRush', level);
    
    // Start displaying the first sequence
    setTimeout(() => {
      displaySequence(initialSequence);
    }, 500);
  }, [generateSequence, startGame, level, displaySequence]);

  // Restart game
  const handleRestart = useCallback(() => {
    const initialSequence = generateSequence(1);
    
    setGameState({
      sequence: initialSequence,
      playerInput: [],
      currentRound: 1,
      score: 0,
      gameOver: false,
      showingSequence: false,
      waitingForInput: false,
      currentSequenceIndex: -1,
    });

    setTimeout(() => {
      displaySequence(initialSequence);
    }, 500);
  }, [generateSequence, displaySequence]);

  // Handle game over
  useEffect(() => {
    if (gameState.gameOver && gameStarted) {
      const finalScore = gameState.score;
      
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
      
      setTimeout(() => {
        endGame(finalScore);
      }, 0);
    }
  }, [gameState.gameOver, gameState.score, gameStarted, endGame]);

  // Auto-start game if autoStart param is true
  useEffect(() => {
    if (autoStart && !gameStarted) {
      handleStartGame();
    }
  }, [autoStart, gameStarted, handleStartGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

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

        <ScrollView
          style={styles.startContainer}
          contentContainerStyle={styles.startContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.gameTitle}>🧩 Memory Rush</Text>
          <Text style={styles.gameSubtitle}>Color Sequence Challenge</Text>

          {/* Level Info */}
          <View style={styles.levelInfoContainer}>
            <Text style={styles.levelTitle}>{levelConfig.name.toUpperCase()} LEVEL</Text>
            <Text style={styles.levelDescription}>
              {levelConfig.description}
            </Text>
            <Text style={styles.levelStats}>
              Sequence: {levelConfig.startSequenceLength}-{levelConfig.maxSequenceLength} colors | 
              Speed: {levelConfig.displaySpeed}ms | Score: x{levelConfig.scoreMultiplier}
            </Text>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to Play:</Text>
            <Text style={styles.instructionsText}>
              • Watch the color sequence carefully{'\n'}
              • Memorize the order of colors{'\n'}
              • Repeat the sequence by tapping colors{'\n'}
              • Each round adds one more color{'\n'}
              • Wrong tap = Game Over!{'\n'}
              • Reach max sequence to win!
            </Text>
          </View>

          {/* Color Preview */}
          <View style={styles.colorPreviewContainer}>
            <Text style={styles.colorPreviewTitle}>Colors in this level:</Text>
            <View style={styles.colorPreviewGrid}>
              {gameColors.map((color, index) => (
                <View
                  key={color.id}
                  style={[
                    styles.colorPreviewItem,
                    { backgroundColor: color.color }
                  ]}
                />
              ))}
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
              <Text style={styles.startButtonText}>START GAME</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Game Screen
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />

      <Animated.View
        style={[
          styles.gameContainer,
          {
            transform: [{
              translateX: shakeAnimation,
            }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.gameHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8E2DE2', '#4A00E0']}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.gameInfo}>
            <Text style={styles.scoreText}>Score: {gameState.score}</Text>
            <Text style={styles.roundText}>Round: {gameState.currentRound}</Text>
            <Text style={styles.levelText}>{levelConfig.name.toUpperCase()}</Text>
          </View>
        </View>

        {/* Sequence Display */}
        <SequenceDisplay
          sequence={gameState.sequence}
          gameColors={gameColors}
          showingSequence={gameState.showingSequence}
          currentSequenceIndex={gameState.currentSequenceIndex}
        />

        {/* Status Text */}
        <View style={styles.statusContainer}>
          {gameState.showingSequence && (
            <Text style={styles.statusText}>
              🧠 Watch the sequence...
            </Text>
          )}
          {gameState.waitingForInput && (
            <Text style={styles.statusText}>
              👆 Repeat the sequence!
            </Text>
          )}
        </View>

        {/* Color Grid */}
        <ColorGrid
          colors={gameColors}
          onColorPress={handleColorPress}
          disabled={!gameState.waitingForInput}
          gridSize={levelConfig.gridSize}
          playerInput={gameState.playerInput}
          correctSequence={gameState.sequence}
        />

        {/* Game Over Modal */}
        <GameOverModal
          visible={gameState.gameOver}
          score={gameState.score}
          round={gameState.currentRound}
          isWin={gameState.sequence.length >= levelConfig.maxSequenceLength && !gameState.gameOver}
          onRestart={handleRestart}
          onExit={() => navigation.goBack()}
          levelName={levelConfig.name}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1B',
  },
  gameContainer: {
    flex: 1,
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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#8E2DE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 1000,
  },
  backButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startContainer: {
    flex: 1,
  },
  startContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 80,
  },
  gameTitle: {
    fontSize: 36,
    fontFamily: 'Orbitron_900Black',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#00FFC6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  gameSubtitle: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    marginBottom: 30,
  },
  levelInfoContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 198, 0.3)',
    width: '100%',
    alignItems: 'center',
  },
  levelTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: '#00FFC6',
    textShadowRadius: 8,
  },
  levelDescription: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  levelStats: {
    fontSize: 11,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFD60A',
    textAlign: 'center',
    lineHeight: 16,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 198, 0.3)',
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: '#00FFC6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
    lineHeight: 22,
    textAlign: 'left',
  },
  colorPreviewContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 198, 0.3)',
    width: '100%',
    alignItems: 'center',
  },
  colorPreviewTitle: {
    fontSize: 14,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    marginBottom: 15,
    textAlign: 'center',
  },
  colorPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  colorPreviewItem: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  startButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#00FFC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    marginBottom: 30,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 80,
  },
  gameInfo: {
    alignItems: 'center',
    flex: 1,
    marginLeft: 20,
  },
  scoreText: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFD60A',
    textShadowColor: '#FFD60A',
    textShadowRadius: 8,
  },
  roundText: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#00FFC6',
    textShadowColor: '#00FFC6',
    textShadowRadius: 5,
  },
  levelText: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 60,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#8E2DE2',
    textShadowRadius: 8,
  },
});