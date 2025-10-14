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
import { ProgressFeedback } from './components/ProgressFeedback';
import { RoundFeedbackModal } from './components/RoundFeedbackModal';

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

const GAME_COLORS: Record<string, GameColor[]> = {
  easy: [
    { id: '1', color: '#E74C3C', name: 'Red' },     // Crvena
    { id: '2', color: '#3498DB', name: 'Blue' },    // Plava  
    { id: '3', color: '#F1C40F', name: 'Yellow' },  // Žuta
    { id: '4', color: '#27AE60', name: 'Green' },   // Zelena
  ],
  medium: [
    { id: '1', color: '#E74C3C', name: 'Red' },     // Crvena
    { id: '2', color: '#3498DB', name: 'Blue' },    // Plava
    { id: '3', color: '#F1C40F', name: 'Yellow' },  // Žuta
    { id: '4', color: '#27AE60', name: 'Green' },   // Zelena
    { id: '5', color: '#9B59B6', name: 'Purple' },  // Ljubičasta
  ],
  hard: [
    { id: '1', color: '#E74C3C', name: 'Red' },     // Crvena
    { id: '2', color: '#E67E22', name: 'Orange' },  // Narandžasta (slična crvenoj)
    { id: '3', color: '#3498DB', name: 'Blue' },    // Plava
    { id: '4', color: '#1ABC9C', name: 'Cyan' },    // Cijan (slična plavoj)
    { id: '5', color: '#F1C40F', name: 'Yellow' },  // Žuta
    { id: '6', color: '#2ECC71', name: 'Lime' },    // Lime (slična žutoj/zelenoj)
  ],
  extreme: [
    { id: '1', color: '#E74C3C', name: 'Red1' },    // Crvena
    { id: '2', color: '#C0392B', name: 'Red2' },    // Tamno crvena
    { id: '3', color: '#E67E22', name: 'Orange1' }, // Narandžasta
    { id: '4', color: '#D35400', name: 'Orange2' }, // Tamno narandžasta
    { id: '5', color: '#3498DB', name: 'Blue1' },   // Plava
    { id: '6', color: '#2980B9', name: 'Blue2' },   // Tamno plava
    { id: '7', color: '#27AE60', name: 'Green1' },  // Zelena
    { id: '8', color: '#229954', name: 'Green2' },  // Tamno zelena
  ],
  'extra-hard': [
    { id: '1', color: '#E74C3C', name: 'Red1' },    // Vrlo slične nijanse crvene
    { id: '2', color: '#EC7063', name: 'Red2' },      
    { id: '3', color: '#C0392B', name: 'Red3' },      
    { id: '4', color: '#3498DB', name: 'Blue1' },   // Vrlo slične nijanse plave
    { id: '5', color: '#5DADE2', name: 'Blue2' },    
    { id: '6', color: '#2E86C1', name: 'Blue3' },    
    { id: '7', color: '#27AE60', name: 'Green1' },  // Vrlo slične nijanse zelene
    { id: '8', color: '#58D68D', name: 'Green2' },  
    { id: '9', color: '#239B56', name: 'Green3' },  
  ],
};

const LEVEL_CONFIGS: Record<string, LevelConfig> = {
  easy: {
    name: 'Easy',
    startSequenceLength: 2,
    maxSequenceLength: 5,
    displaySpeed: 1000,
    colorCount: 4,
    gridSize: { rows: 2, cols: 2 },
    scoreMultiplier: 1,
    description: 'Perfect for beginners - 4 distinct colors, slow pace',
  },
  medium: {
    name: 'Medium',
    startSequenceLength: 3,
    maxSequenceLength: 7,
    displaySpeed: 800,
    colorCount: 5,
    gridSize: { rows: 2, cols: 3 },
    scoreMultiplier: 1.5,
    description: 'Getting challenging - 5 colors, medium pace',
  },
  hard: {
    name: 'Hard',
    startSequenceLength: 4,
    maxSequenceLength: 9,
    displaySpeed: 650,
    colorCount: 6,
    gridSize: { rows: 2, cols: 3 },
    scoreMultiplier: 2,
    description: 'For experts - similar colors, faster pace',
  },
  extreme: {
    name: 'Extreme',
    startSequenceLength: 5,
    maxSequenceLength: 11,
    displaySpeed: 500,
    colorCount: 8,
    gridSize: { rows: 3, cols: 3 },
    scoreMultiplier: 2.5,
    description: 'Similar colors to confuse you - 8 colors, very fast',
  },
  'extra-hard': {
    name: 'Extra Hard',
    startSequenceLength: 6,
    maxSequenceLength: 13,
    displaySpeed: 450,
    colorCount: 9,
    gridSize: { rows: 3, cols: 3 },
    scoreMultiplier: 3,
    description: 'Nearly identical colors - ultimate confusion test',
  },
};

interface FeedbackSquare {
  status: 'pending' | 'correct' | 'incorrect';
  colorId?: string;
}

interface GameState {
  sequence: string[];
  playerInput: string[];
  currentRound: number;
  totalRounds: number;
  score: number;
  gameOver: boolean;
  showingSequence: boolean;
  waitingForInput: boolean;
  currentSequenceIndex: number;
  roundCompleted: boolean;
  showRoundFeedback: boolean;
  userProgress: FeedbackSquare[];
  currentInputIndex: number;
  roundScore: number;
}



export const MemoryRushGame: React.FC<MemoryRushGameProps> = ({ navigation, route }) => {
  const { level = 'easy', autoStart = false } = route.params || {};
  const { startGame, endGame, updateScore } = useGame();
  const levelConfig = LEVEL_CONFIGS[level];
  const gameColors = GAME_COLORS[level] || GAME_COLORS.easy;

  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    sequence: [],
    playerInput: [],
    currentRound: 1,
    totalRounds: 3,
    score: 0,
    gameOver: false,
    showingSequence: false,
    waitingForInput: false,
    currentSequenceIndex: -1,
    roundCompleted: false,
    showRoundFeedback: false,
    userProgress: [],
    currentInputIndex: 0,
    roundScore: 0,
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
      sequence: sequence,
      showingSequence: true,
      waitingForInput: false,
      currentSequenceIndex: -1,
      userProgress: sequence.map(() => ({ status: 'pending' as const })),
      currentInputIndex: 0,
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
      const isCorrect = prev.sequence[currentIndex] === colorId;
      
      // Update user progress with feedback
      const newUserProgress = [...prev.userProgress];
      newUserProgress[currentIndex] = {
        status: isCorrect ? 'correct' : 'incorrect',
        colorId: colorId,
      };
      
      // Check if current input is correct
      if (!isCorrect) {
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
          userProgress: newUserProgress,
          currentInputIndex: currentIndex + 1,
        };
      }

      // Correct color
      if (newPlayerInput.length === prev.sequence.length) {
        // Sequence completed successfully
        const baseScore = prev.sequence.length * Math.round(levelConfig.scoreMultiplier * 10);
        let newScore = prev.score + baseScore;
        
        // Update score in store
        setTimeout(() => {
          updateScore(baseScore);
        }, 0);

        // Check if reached max sequence length for this round
        if (prev.sequence.length >= levelConfig.maxSequenceLength) {
          // Round completed!
          const roundsLeft = prev.totalRounds - prev.currentRound;
          
          if (roundsLeft === 0) {
            // All 3 rounds completed - add bonus points!
            const bonusPoints = Math.round(baseScore * 2); // 200% bonus
            newScore += bonusPoints;
            setTimeout(() => {
              updateScore(bonusPoints);
            }, 100);
            
            return {
              ...prev,
              score: newScore,
              gameOver: true,
              waitingForInput: false,
              roundCompleted: true,
              showRoundFeedback: true,
            };
          } else {
            // Show round completion feedback and move to next round
            setTimeout(() => {
              setGameState(currentState => ({
                ...currentState,
                showRoundFeedback: false,
                currentRound: currentState.currentRound + 1,
                playerInput: [],
                waitingForInput: false,
                showingSequence: false,
              }));
              
              // Start next round
              const newSequence = generateSequence(1); // Reset to starting length
              setTimeout(() => {
                displaySequence(newSequence);
              }, 500);
            }, 2000); // Show feedback for 2 seconds
            
            return {
              ...prev,
              score: newScore,
              playerInput: [],
              waitingForInput: false,
              roundCompleted: true,
              showRoundFeedback: true,
            };
          }
        }

        // Continue with longer sequence in same round
        const newSequence = generateSequence(prev.sequence.length + 1);
        
        // Start next sequence after a short delay
        setTimeout(() => {
          displaySequence(newSequence);
        }, 1000);

        return {
          ...prev,
          playerInput: [],
          score: newScore,
          sequence: newSequence,
          waitingForInput: false,
          showRoundFeedback: false,
        };
      }

      // More colors needed
      return {
        ...prev,
        playerInput: newPlayerInput,
        userProgress: newUserProgress,
        currentInputIndex: currentIndex + 1,
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
      totalRounds: 3,
      score: 0,
      gameOver: false,
      showingSequence: false,
      waitingForInput: false,
      currentSequenceIndex: -1,
      roundCompleted: false,
      showRoundFeedback: false,
      userProgress: initialSequence.map(() => ({ status: 'pending' as const })),
      currentInputIndex: 0,
      roundScore: 0,
    });

    startGame('memoryRush', level);
    
    // Start displaying the first sequence
    setTimeout(() => {
      displaySequence(initialSequence);
    }, 500);
  }, [generateSequence, startGame, level, displaySequence]);

  // Handle round feedback continue
  const handleRoundContinue = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      showRoundFeedback: false,
    }));
  }, []);

  // Restart game
  const handleRestart = useCallback(() => {
    const initialSequence = generateSequence(1);
    
    setGameState({
      sequence: initialSequence,
      playerInput: [],
      currentRound: 1,
      totalRounds: 3,
      score: 0,
      gameOver: false,
      showingSequence: false,
      waitingForInput: false,
      currentSequenceIndex: -1,
      roundCompleted: false,
      showRoundFeedback: false,
      userProgress: initialSequence.map(() => ({ status: 'pending' as const })),
      currentInputIndex: 0,
      roundScore: 0,
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
              • 3 ROUNDS to complete this level{'\n'}
              • Watch the color sequence carefully{'\n'}
              • Memorize the order of colors{'\n'}
              • Repeat the sequence by tapping colors{'\n'}
              • Each sequence gets longer{'\n'}
              • Complete all 3 rounds for BONUS POINTS!{'\n'}
              • Wrong tap = Game Over!
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
            <Text style={styles.roundText}>Round: {gameState.currentRound}/{gameState.totalRounds}</Text>
            <Text style={styles.levelText}>{levelConfig.name.toUpperCase()}</Text>
          </View>
        </View>

        {/* Sequence Display - Hide when waiting for input */}
        {(!gameState.waitingForInput || gameState.showRoundFeedback) && (
          <SequenceDisplay
            sequence={gameState.sequence}
            gameColors={gameColors}
            showingSequence={gameState.showingSequence}
            currentSequenceIndex={gameState.currentSequenceIndex}
          />
        )}

        {/* Status Text */}
        <View style={styles.statusContainer}>
          {gameState.showRoundFeedback && !gameState.gameOver && (
            <Text style={styles.roundFeedbackText}>
              🎉 Round {gameState.currentRound - 1} Complete! 🎉{'\n'}
              {gameState.currentRound <= gameState.totalRounds ? `Starting Round ${gameState.currentRound}...` : 'All rounds complete!'}
            </Text>
          )}
          {gameState.showRoundFeedback && gameState.gameOver && (
            <Text style={styles.roundFeedbackText}>
              🏆 ALL 3 ROUNDS COMPLETE! 🏆{'\n'}
              BONUS POINTS AWARDED!
            </Text>
          )}
          {gameState.showingSequence && !gameState.showRoundFeedback && (
            <Text style={styles.statusText}>
              🧠 Watch the sequence...
            </Text>
          )}
          {gameState.waitingForInput && !gameState.showRoundFeedback && (
            <Text style={styles.statusText}>
              👆 Repeat the sequence!
            </Text>
          )}
        </View>

        {/* Progress Feedback */}
        {gameState.waitingForInput && (
          <ProgressFeedback
            sequence={gameState.sequence}
            userProgress={gameState.userProgress}
            currentInputIndex={gameState.currentInputIndex}
          />
        )}

        {/* Color Grid */}
        <ColorGrid
          colors={gameColors}
          onColorPress={handleColorPress}
          disabled={!gameState.waitingForInput}
          gridSize={levelConfig.gridSize}
          playerInput={gameState.playerInput}
          correctSequence={gameState.sequence}
        />

        {/* Round Feedback Modal */}
        <RoundFeedbackModal
          visible={gameState.showRoundFeedback && !gameState.gameOver}
          roundNumber={gameState.currentRound}
          totalRounds={gameState.totalRounds}
          roundScore={gameState.roundScore}
          isRoundComplete={gameState.roundCompleted}
          onContinue={handleRoundContinue}
        />

        {/* Game Over - temporary simple modal */}
        {gameState.gameOver && (
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverModal}>
              <Text style={styles.gameOverTitle}>Game Over!</Text>
              <Text style={styles.gameOverScore}>Final Score: {gameState.score}</Text>
              <TouchableOpacity style={styles.gameButton} onPress={handleRestart}>
                <Text style={styles.gameButtonText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gameButton} onPress={() => navigation.goBack()}>
                <Text style={styles.gameButtonText}>Back to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  roundFeedbackText: {
    fontSize: 20,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    textAlign: 'center',
    textShadowColor: '#00FFC6',
    textShadowRadius: 10,
    lineHeight: 28,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverModal: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FFC6',
    width: '80%',
  },
  gameOverTitle: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    marginBottom: 20,
  },
  gameOverScore: {
    fontSize: 18,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFD60A',
    marginBottom: 30,
  },
  gameButton: {
    backgroundColor: '#00FFC6',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginVertical: 5,
    width: '100%',
  },
  gameButtonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#1A1A2E',
    textAlign: 'center',
  },
});