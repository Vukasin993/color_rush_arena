import React, { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Vibration,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
} from "@expo-google-fonts/orbitron";
import { useGame } from "../../store/useGameStore";
import { logGameStart, logGameEnd } from "../../firebase/analytics";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { ColorGrid } from "./components/ColorGrid";
import { SequenceDisplay } from "./components/SequenceDisplay";
import { ProgressFeedback } from "./components/ProgressFeedback";
import { RoundFeedbackModal } from "./components/RoundFeedbackModal";
import { useAuthStore } from "../../store/useAuthStore";

type MemoryRushGameProps = NativeStackScreenProps<
  RootStackParamList,
  "MemoryRushGame"
>;

export interface GameColor {
  id: string;
  color: string;
  name: string;
  sound?: string;
}

const GAME_COLORS: GameColor[] = [
  { id: "1", color: "#E74C3C", name: "Red" }, // Crvena
  { id: "2", color: "#3498DB", name: "Blue" }, // Plava
  { id: "3", color: "#2ECC71", name: "Green" }, // Zelena
  { id: "4", color: "#F39C12", name: "Orange" }, // Narandžasta
  { id: "5", color: "#9B59B6", name: "Purple" }, // Ljubičasta
  { id: "6", color: "#1ABC9C", name: "Teal" }, // Tirkizna
  { id: "7", color: "#E67E22", name: "Carrot" }, // Šargarepa
  { id: "8", color: "#34495E", name: "Navy" }, // Teget
];

// Progressive difficulty configuration
const getGameConfig = (level: number) => {
  let colorCount = 2;
  let minSequenceLength = 2;
  let maxSequenceLength = 4;

  if (level >= 31) {
    colorCount = 8;
    minSequenceLength = 8;
    maxSequenceLength = 15;
  } else if (level >= 26) {
    colorCount = 7;
    minSequenceLength = 7;
    maxSequenceLength = 13;
  } else if (level >= 21) {
    colorCount = 6;
    minSequenceLength = 6;
    maxSequenceLength = 11;
  } else if (level >= 16) {
    colorCount = 5;
    minSequenceLength = 5;
    maxSequenceLength = 10;
  } else if (level >= 11) {
    colorCount = 4;
    minSequenceLength = 4;
    maxSequenceLength = 8;
  } else if (level >= 6) {
    colorCount = 3;
    minSequenceLength = 3;
    maxSequenceLength = 6;
  }

  const levelInRange = level % 5 || 5;
  const currentSequenceLength = minSequenceLength + (levelInRange - 1);

  return {
    colorCount,
    currentSequenceLength: Math.min(currentSequenceLength, maxSequenceLength),
    displaySpeed: Math.max(400, 800 - level * 10),
    gridSize:
      colorCount <= 2
        ? { rows: 1, cols: 2 }
        : colorCount <= 4
        ? { rows: 2, cols: 2 }
        : colorCount <= 6
        ? { rows: 2, cols: 3 }
        : { rows: 3, cols: 3 },
    scoreMultiplier: 1 + level * 0.1,
  };
};

const getColorsForLevel = (level: number): GameColor[] => {
  const config = getGameConfig(level);
  return GAME_COLORS.slice(0, config.colorCount);
};

interface FeedbackSquare {
  status: "pending" | "correct" | "incorrect";
  colorId?: string;
}

interface PowerUps {
  repeatSequence: number;
  skipLevel: number;
  adsWatched: number;
}

interface GameState {
  sequence: string[];
  playerInput: string[];
  currentLevel: number;
  score: number;
  gameOver: boolean;
  showingSequence: boolean;
  waitingForInput: boolean;
  currentSequenceIndex: number;
  levelCompleted: boolean;
  showLevelFeedback: boolean;
  userProgress: FeedbackSquare[];
  currentInputIndex: number;
  levelScore: number;
  powerUps: PowerUps;
  highestLevel: number;
  canWatchAdToContinue: boolean;
}

export const MemoryRushGame: React.FC<MemoryRushGameProps> = ({
  navigation,
  route,
}) => {
  const { autoStart = false, continueSaved = false } = route.params || {};
  const { startGame, updateScore, endGame } = useGame();

  const [gameStarted, setGameStarted] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    sequence: [],
    playerInput: [],
    currentLevel: 1,
    score: 0,
    gameOver: false,
    showingSequence: false,
    waitingForInput: false,
    currentSequenceIndex: -1,
    levelCompleted: false,
    showLevelFeedback: false,
    userProgress: [],
    currentInputIndex: 0,
    levelScore: 0,
    powerUps: {
      repeatSequence: 0,
      skipLevel: 0,
      adsWatched: 0,
    },
    highestLevel: 1,
    canWatchAdToContinue: false,
  });

  // ...existing code...

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const sequenceTimeoutRef = useRef<number | null>(null);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
  });

  const STORAGE_KEY = "@memory_rush_saved_game";
  // Load saved game if requested
  useEffect(() => {
    if (continueSaved) {
      (async () => {
        const savedStr = await AsyncStorage.getItem(STORAGE_KEY);
        console.log("*** SAVED STR: ***", savedStr);
        if (savedStr) {
          const saved = JSON.parse(savedStr);
          setGameState(saved);
          setGameStarted(true);
        }
      })();
    }
  }, [continueSaved]);

  const handlePauseAndSave = useCallback(async () => {
  console.log("*** GAME STATE *** ", gameState);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  navigation.navigate("MainTabs", { screen: "HomeScreen" });
  }, [gameState, navigation]);

  // Generate sequence for current level
  const generateSequence = useCallback((level: number): string[] => {
    const config = getGameConfig(level);
    const availableColors = getColorsForLevel(level);

    const sequence: string[] = [];
    for (let i = 0; i < config.currentSequenceLength; i++) {
      const randomColor =
        availableColors[Math.floor(Math.random() * availableColors.length)];
      sequence.push(randomColor.id);
    }
    return sequence;
  }, []);

  // Display sequence to player
  const displaySequence = useCallback(
    (sequence: string[]) => {
      console.log("displaySequence called with:", sequence);
      setGameState((prev) => ({
        ...prev,
        sequence: sequence,
        showingSequence: true,
        waitingForInput: false,
        currentSequenceIndex: -1,
        userProgress: sequence.map(() => ({ status: "pending" as const })),
        currentInputIndex: 0,
      }));

      let index = 0;
      const showNextColor = () => {
        console.log(
          "showNextColor, index:",
          index,
          "sequence.length:",
          sequence.length
        );
        if (index < sequence.length) {
          setGameState((prev) => ({
            ...prev,
            currentSequenceIndex: index,
          }));

          sequenceTimeoutRef.current = setTimeout(() => {
            setGameState((prev) => ({
              ...prev,
              currentSequenceIndex: -1,
            }));

            setTimeout(() => {
              index++;
              showNextColor();
            }, 200);
          }, getGameConfig(gameState.currentLevel).displaySpeed);
        } else {
          // Sequence display complete, wait for player input
          setTimeout(() => {
            setGameState((prev) => ({
              ...prev,
              showingSequence: false,
              waitingForInput: true,
              currentSequenceIndex: -1,
            }));
          }, 500);
        }
      };

      showNextColor();
    },
    [gameState.currentLevel]
  );

  // Handle player color selection
  const handleColorPress = useCallback(
    (colorId: string) => {
      // Blokiraj svaki dalji unos čim postoji bilo koji 'incorrect' u userProgress
      if (
        !gameState.waitingForInput ||
        gameState.gameOver ||
        gameState.userProgress.some((p) => p.status === "incorrect")
      ) {
        return;
      }

      // Spreči višestruke klikove na isti korak
      const currentIndex = gameState.playerInput.length;
      if (
        gameState.userProgress[currentIndex] &&
        gameState.userProgress[currentIndex].status !== "pending"
      ) {
        return;
      }

      Vibration.vibrate(30);

      setGameState((prev) => {
        const newPlayerInput = [...prev.playerInput, colorId];
        const currentIndex = newPlayerInput.length - 1;
        const isCorrect = prev.sequence[currentIndex] === colorId;

        const newUserProgress = [...prev.userProgress];
        newUserProgress[currentIndex] = {
          status: isCorrect ? "correct" : "incorrect",
          colorId: colorId,
        };

        if (!isCorrect) {
          Vibration.vibrate([200, 100, 200]);

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

          setTimeout(async () => {
            // Update stats in Firebase and store
            const updateGameStats = useAuthStore.getState().updateGameStats;
            const xpEarned = Math.round(gameState.score * 1.2);
            await updateGameStats(
              "memoryRush",
              "easy",
              gameState.score,
              xpEarned,
              gameState.highestLevel
            );
            setGameState((p) => ({
              ...p,
              gameOver: true,
              waitingForInput: false,
            }));
          }, 2500);

          return {
            ...prev,
            userProgress: newUserProgress,
            currentInputIndex: currentIndex + 1,
          };
        }

        // Level completed!
        if (newPlayerInput.length === prev.sequence.length) {
          const config = getGameConfig(prev.currentLevel);
          const baseScore =
            prev.sequence.length * Math.round(config.scoreMultiplier * 10);
          let newScore = prev.score + baseScore;
          const newLevel = prev.currentLevel + 1;
          const newHighestLevel = Math.max(prev.highestLevel, newLevel);

          // prvo osveži progres bar (zeleno), pa tek onda feedback modal
          setTimeout(() => {
            updateScore(baseScore);
            setGameState((p) => ({
              ...p,
              score: newScore,
              playerInput: [],
              waitingForInput: false,
              levelCompleted: true,
              showLevelFeedback: true,
              levelScore: baseScore,
              highestLevel: newHighestLevel,
            }));
          }, 500); // delay pre nego što se pojavi "level complete"

          return {
            ...prev,
            userProgress: newUserProgress,
            currentInputIndex: currentIndex + 1,
          };
        }

        return {
          ...prev,
          playerInput: newPlayerInput,
          userProgress: newUserProgress,
          currentInputIndex: currentIndex + 1,
        };
      });
    },
    [
      gameState.waitingForInput,
      gameState.gameOver,
      gameState.userProgress,
      updateScore,
      generateSequence,
      displaySequence,
      shakeAnimation,
    ]
  );

  // Start new game
  const handleStartGame = useCallback(async () => {
    logGameStart("memoryRush");
    await AsyncStorage.removeItem(STORAGE_KEY);
    const initialSequence = generateSequence(1);

    setGameStarted(true);
    setGameState({
      sequence: initialSequence,
      playerInput: [],
      currentLevel: 1,
      score: 0,
      gameOver: false,
      showingSequence: false,
      waitingForInput: false,
      currentSequenceIndex: -1,
      levelCompleted: false,
      showLevelFeedback: false,
      userProgress: initialSequence.map(() => ({ status: "pending" as const })),
      currentInputIndex: 0,
      levelScore: 0,
      powerUps: {
        repeatSequence: 3,
        skipLevel: 3,
        adsWatched: 0,
      },
      highestLevel: 1,
      canWatchAdToContinue: true,
    });

    startGame("memoryRush", "easy");

    setTimeout(() => {
      displaySequence(initialSequence);
    }, 500);
  }, [generateSequence, startGame, displaySequence]);

  // Handle level feedback continue
  const handleLevelContinue = useCallback(() => {
    const newLevel = gameState.currentLevel + 1;
    const newSequence = generateSequence(newLevel);

    setGameState((prev) => ({
      ...prev,
      showLevelFeedback: false,
      currentLevel: newLevel,
      sequence: newSequence,
      playerInput: [],
      waitingForInput: false,
      showingSequence: false,
      userProgress: newSequence.map(() => ({ status: "pending" as const })),
      currentInputIndex: 0,
      levelScore: 0,
      highestLevel: Math.max(prev.highestLevel, newLevel),
    }));

    setTimeout(() => {
      displaySequence(newSequence);
    }, 500);
  }, [gameState.currentLevel, generateSequence, displaySequence]);

  // Restart game
  const handleRestart = useCallback(() => {
    logGameStart("memoryRush");
    const initialSequence = generateSequence(1);
    setGameState({
      sequence: initialSequence,
      playerInput: [],
      currentLevel: 1,
      score: 0,
      gameOver: false,
      showingSequence: false,
      waitingForInput: false,
      currentSequenceIndex: -1,
      levelCompleted: false,
      showLevelFeedback: false,
      userProgress: initialSequence.map(() => ({ status: "pending" as const })),
      currentInputIndex: 0,
      levelScore: 0,
      powerUps: {
        repeatSequence: 3,
        skipLevel: 3,
        adsWatched: 0,
      },
      highestLevel: 1,
      canWatchAdToContinue: true,
    });
    setTimeout(() => {
      displaySequence(initialSequence);
    }, 500);
  }, [
    generateSequence,
    displaySequence,
    gameState.score,
    gameState.highestLevel,
  ]);

  // Watch ad to continue
  const handleWatchAdToContinue = useCallback(() => {
    // Simulate ad watching (you can integrate real ad SDK here)
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        gameOver: false,
        waitingForInput: true,
        canWatchAdToContinue: false, // Can only use once per game
        powerUps: {
          ...prev.powerUps,
          adsWatched: prev.powerUps.adsWatched + 1,
        },
      }));
    }, 1500); // Simulate ad duration
  }, []);

  // Use repeat sequence power-up
  const useRepeatSequence = useCallback(() => {
    if (gameState.powerUps.repeatSequence > 0 && gameState.waitingForInput) {
      setGameState((prev) => ({
        ...prev,
        powerUps: {
          ...prev.powerUps,
          repeatSequence: prev.powerUps.repeatSequence - 1,
        },
        waitingForInput: false,
      }));

      setTimeout(() => {
        displaySequence(gameState.sequence);
      }, 300);
    }
  }, [
    gameState.powerUps.repeatSequence,
    gameState.waitingForInput,
    gameState.sequence,
    displaySequence,
  ]);

  // Use skip level power-up
  const useSkipLevel = useCallback(() => {
    if (gameState.powerUps.skipLevel > 0 && gameState.waitingForInput) {
      const newLevel = gameState.currentLevel + 1;
      const newSequence = generateSequence(newLevel);

      setGameState((prev) => ({
        ...prev,
        currentLevel: newLevel,
        sequence: newSequence,
        playerInput: [],
        waitingForInput: false,
        showingSequence: false,
        userProgress: newSequence.map(() => ({ status: "pending" as const })),
        currentInputIndex: 0,
        highestLevel: Math.max(prev.highestLevel, newLevel),
        powerUps: {
          ...prev.powerUps,
          skipLevel: prev.powerUps.skipLevel - 1,
        },
      }));

      setTimeout(() => {
        displaySequence(newSequence);
      }, 500);
    }
  }, [
    gameState.powerUps.skipLevel,
    gameState.waitingForInput,
    gameState.currentLevel,
    generateSequence,
    displaySequence,
  ]);

  // Auto-start if specified
  useEffect(() => {
    if (autoStart && !gameStarted) {
      handleStartGame();
    }
  }, [autoStart, gameStarted, handleStartGame]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const currentConfig = getGameConfig(gameState.currentLevel);
  const currentColors = getColorsForLevel(gameState.currentLevel);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0e1a"
        translucent
      />

      {!gameStarted ? (
        // Start Screen
        <ScrollView
          style={styles.gameContainer}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={styles.startContainer}>
            <LinearGradient
              colors={["#1a1a2e", "#16213e", "#0f3460"]}
              style={styles.startGradient}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  logGameEnd("memoryRush", gameState.score);
                  navigation.goBack();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#00FFC6" />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text style={styles.gameTitle}>🧩 Memory Rush</Text>
                <Text style={styles.gameSubtitle}>Endless Color Challenge</Text>
              </View>

              <View style={styles.levelInfoContainer}>
                <Text style={styles.levelTitle}>ENDLESS MODE</Text>
                <Text style={styles.levelDescription}>
                  Infinite levels with progressive difficulty! How far can you
                  go?
                </Text>
                <Text style={styles.levelStats}>
                  Start: 2 colors, 2 sequence | Colors increase every 5 levels
                </Text>
              </View>

              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>How to Play:</Text>
                <Text style={styles.instructionsText}>
                  • INFINITE LEVELS - No limit!{"\n"}• Watch the color sequence
                  carefully{"\n"}• Memorize the order of colors{"\n"}• Repeat
                  the sequence by tapping colors{"\n"}• Level up after each
                  successful sequence{"\n"}• More colors unlock as you progress
                  {"\n"}• Wrong tap = Game Over!{"\n"}• Powerups: Repeat (3x),
                  Skip Level (3x)
                </Text>
              </View>

              <View style={styles.colorPreviewContainer}>
                <Text style={styles.colorPreviewTitle}>Starting colors:</Text>
                <View style={styles.colorPreviewGrid}>
                  {getColorsForLevel(1).map((color) => (
                    <View
                      key={color.id}
                      style={[
                        styles.colorPreviewItem,
                        { backgroundColor: color.color },
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
                  colors={["#00FFC6", "#00D4AA"]}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>
                    🎮 START ENDLESS MODE
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      ) : (
        // Game Screen
        <View style={styles.gameContainer}>
          {/* Game Header */}
          <View style={styles.gameHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#00FFC6" />
            </TouchableOpacity>

            <View style={styles.gameInfo}>
              <Text style={styles.scoreText}>{gameState.score}</Text>
              <Text style={styles.levelText}>
                Level: {gameState.currentLevel}
              </Text>
              <Text style={styles.levelText}>
                Best: {gameState.highestLevel}
              </Text>
            </View>

            {/* Power-ups */}
            <View style={styles.powerUpsContainer}>
              <TouchableOpacity
                style={[
                  styles.powerUpButton,
                  gameState.powerUps.repeatSequence === 0 &&
                    styles.powerUpDisabled,
                ]}
                onPress={useRepeatSequence}
                disabled={
                  gameState.powerUps.repeatSequence === 0 ||
                  !gameState.waitingForInput
                }
              >
                <Text style={styles.powerUpText}>
                  🔄 {gameState.powerUps.repeatSequence}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.powerUpButton,
                  gameState.powerUps.skipLevel === 0 && styles.powerUpDisabled,
                ]}
                onPress={useSkipLevel}
                disabled={
                  gameState.powerUps.skipLevel === 0 ||
                  !gameState.waitingForInput
                }
              >
                <Text style={styles.powerUpText}>
                  ⏭️ {gameState.powerUps.skipLevel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              height: 130,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Sequence Display */}
            {(!gameState.waitingForInput || gameState.showLevelFeedback) && (
              <SequenceDisplay
                sequence={gameState.sequence}
                gameColors={currentColors}
                showingSequence={gameState.showingSequence}
                currentSequenceIndex={gameState.currentSequenceIndex}
              />
            )}

            {/* Progress Feedback */}
            {gameState.waitingForInput && (
              <ProgressFeedback
                sequence={gameState.sequence}
                userProgress={gameState.userProgress}
                currentInputIndex={gameState.currentInputIndex}
              />
            )}
          </View>
          {/* Status Messages */}
          <View style={styles.statusContainer}>
            {gameState.showLevelFeedback && !gameState.gameOver && (
              <Text style={styles.levelFeedbackText}>
                🎉 Level {gameState.currentLevel - 1} Complete! 🎉{"\n"}
                Next Level: {currentConfig.colorCount} colors,{" "}
                {currentConfig.currentSequenceLength} sequence
              </Text>
            )}
            {gameState.showLevelFeedback && gameState.gameOver && (
              <Text style={styles.levelFeedbackText}>
                🏆 FINAL LEVEL: {gameState.currentLevel} 🏆{"\n"}
                AMAZING PERFORMANCE!
              </Text>
            )}
            {gameState.showingSequence && !gameState.showLevelFeedback && (
              <Text style={styles.statusText}>
                🧠 Watch the sequence... (Level {gameState.currentLevel})
              </Text>
            )}
            {gameState.waitingForInput && !gameState.showLevelFeedback && (
              <Text style={styles.statusText}>
                👆 Repeat the sequence! ({gameState.currentInputIndex}/
                {gameState.sequence.length})
              </Text>
            )}
          </View>

          {/* Color Grid */}
          <Animated.View
            style={[
              styles.gridContainer,
              { transform: [{ translateX: shakeAnimation }] },
            ]}
          >
            <ColorGrid
              colors={currentColors}
              onColorPress={handleColorPress}
              disabled={!gameState.waitingForInput}
              gridSize={currentConfig.gridSize}
              playerInput={gameState.playerInput}
              correctSequence={gameState.sequence}
            />
          </Animated.View>

          {/* Level Feedback Modal */}
          <RoundFeedbackModal
            visible={gameState.showLevelFeedback && !gameState.gameOver}
            roundNumber={gameState.currentLevel}
            totalRounds={999} // Endless
            roundScore={gameState.levelScore}
            isRoundComplete={gameState.levelCompleted}
            onContinue={handleLevelContinue}
            onPauseAndSave={handlePauseAndSave}
          />

          {/* Game Over or Level 999 Completion */}
          {gameState.gameOver && gameState.currentLevel !== 1000 && (
            <View style={styles.gameOverOverlay}>
              <View style={styles.gameOverModal}>
                <Text style={styles.gameOverTitle}>Game Over!</Text>
                <Text style={styles.gameOverScore}>
                  Final Level: {gameState.currentLevel}
                </Text>
                <Text style={styles.gameOverScore}>
                  Final Score: {gameState.score}
                </Text>
                <Text style={styles.gameOverScore}>
                  Best Level: {gameState.highestLevel}
                </Text>

                {/* Watch Ad to Continue - only once per game */}
                {gameState.canWatchAdToContinue && (
                  <TouchableOpacity
                    style={[styles.gameButton, styles.adButton]}
                    onPress={handleWatchAdToContinue}
                  >
                    <Text style={styles.gameButtonText}>
                      🎥 Watch Ad to Continue
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.gameButton}
                  onPress={handleRestart}
                >
                  <Text style={styles.gameButtonText}>Play Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.gameButton}
                  onPress={async () => {
                    endGame(gameState.score);
                    logGameEnd("memoryRush", gameState.score);
                    await AsyncStorage.removeItem(STORAGE_KEY);
                    navigation.replace("GameOverScreen", {
                      gameType: "memoryRush",
                      score: gameState.score,
                      xpEarned: Math.round(gameState.score * 1.2),
                      level: gameState.currentLevel,
                      highestLevel: gameState.highestLevel,
                    });
                  }}
                >
                  <Text style={styles.gameButtonText}>Game Over</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Special Modal for Level 999 Completion */}
          {gameState.currentLevel === 1000 && (
            <View style={styles.gameOverOverlay}>
              <View style={[styles.gameOverModal, { borderColor: '#FFD700', backgroundColor: '#1a1a2e' }]}> 
                <Text style={[styles.gameOverTitle, { color: '#FFD700', fontSize: 32 }]}>🏅 LEGENDARY!</Text>
                <Text style={{ fontSize: 22, color: '#FFD700', fontFamily: 'Orbitron_700Bold', textAlign: 'center', marginBottom: 20 }}>
                  You completed LEVEL 999!
                </Text>
                <Text style={{ fontSize: 18, color: '#FFFFFF', textAlign: 'center', marginBottom: 10 }}>
                  This is a world-class achievement. Your memory and focus are unmatched!
                </Text>
                <Text style={{ fontSize: 16, color: '#FFD700', textAlign: 'center', marginBottom: 20 }}>
                  Final Score: {gameState.score}
                </Text>
                <TouchableOpacity
                  style={[styles.gameButton, { backgroundColor: '#FFD700' }]}
                  onPress={handleRestart}
                >
                  <Text style={[styles.gameButtonText, { color: '#1a1a2e' }]}>Play Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.gameButton}
                  onPress={async () => {
                    endGame(gameState.score);
                    logGameEnd("memoryRush", gameState.score);
                    await AsyncStorage.removeItem(STORAGE_KEY);
                    navigation.replace("GameOverScreen", {
                      gameType: "memoryRush",
                      score: gameState.score,
                      xpEarned: Math.round(gameState.score * 1.2),
                      level: gameState.currentLevel,
                      highestLevel: gameState.highestLevel,
                    });
                  }}
                >
                  <Text style={styles.gameButtonText}>Finish</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e1a",
  },
  gameContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0a0e1a",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontFamily: "Orbitron_400Regular",
    color: "#00FFC6",
  },
  startContainer: {
    flex: 1,
    padding: 20,
  },
  startGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0, 255, 198, 0.1)",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 80,
  },
  gameTitle: {
    fontSize: 32,
    fontFamily: "Orbitron_900Black",
    color: "#00FFC6",
    textAlign: "center",
    textShadowColor: "#00FFC6",
    textShadowRadius: 15,
    marginBottom: 10,
  },
  gameSubtitle: {
    fontSize: 16,
    fontFamily: "Orbitron_400Regular",
    color: "#B8B8D1",
    textAlign: "center",
  },
  levelInfoContainer: {
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  levelTitle: {
    fontSize: 24,
    fontFamily: "Orbitron_700Bold",
    color: "#FFD60A",
    textAlign: "center",
    textShadowColor: "#FFD60A",
    textShadowRadius: 8,
    marginBottom: 10,
  },
  levelDescription: {
    fontSize: 14,
    fontFamily: "Orbitron_400Regular",
    color: "#B8B8D1",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 10,
  },
  levelStats: {
    fontSize: 12,
    fontFamily: "Orbitron_400Regular",
    color: "#8E2DE2",
    textAlign: "center",
    lineHeight: 16,
  },
  instructionsContainer: {
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFC6",
    textAlign: "center",
    marginBottom: 15,
    textShadowColor: "#00FFC6",
    textShadowRadius: 5,
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: "Orbitron_400Regular",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 22,
  },
  colorPreviewContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  colorPreviewTitle: {
    fontSize: 16,
    fontFamily: "Orbitron_700Bold",
    color: "#FFD60A",
    marginBottom: 15,
    textShadowColor: "#FFD60A",
    textShadowRadius: 5,
  },
  colorPreviewGrid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  colorPreviewItem: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  startButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: "#00FFC6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    marginBottom: 30,
  },
  startButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 80,
  },
  gameInfo: {
    alignItems: "center",
    flex: 1,
    marginLeft: 48,
  },
  scoreText: {
    fontSize: 24,
    fontFamily: "Orbitron_700Bold",
    color: "#FFD60A",
    textShadowColor: "#FFD60A",
    textShadowRadius: 8,
  },
  levelText: {
    fontSize: 14,
    fontFamily: "Orbitron_400Regular",
    color: "#00FFC6",
    textShadowColor: "#00FFC6",
    textShadowRadius: 5,
  },
  powerUpsContainer: {
    alignItems: "center",
    gap: 8,
  },
  powerUpButton: {
    backgroundColor: "rgba(0, 255, 198, 0.2)",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#00FFC6",
  },
  powerUpDisabled: {
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    borderColor: "#666",
  },
  powerUpText: {
    fontSize: 12,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFC6",
  },
  statusContainer: {
    alignItems: "center",
    paddingVertical: 20,
    minHeight: 60,
    justifyContent: "center",
  },
  statusText: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "#8E2DE2",
    textShadowRadius: 8,
  },
  levelFeedbackText: {
    fontSize: 20,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFC6",
    textAlign: "center",
    textShadowColor: "#00FFC6",
    textShadowRadius: 10,
    lineHeight: 28,
  },
  gridContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gameOverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  gameOverModal: {
    backgroundColor: "#1A1A2E",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00FFC6",
    width: "90%",
  },
  gameOverTitle: {
    fontSize: 24,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFC6",
    marginBottom: 20,
  },
  gameOverScore: {
    fontSize: 16,
    fontFamily: "Orbitron_400Regular",
    color: "#FFD60A",
    marginBottom: 10,
  },
  gameButton: {
    backgroundColor: "#00FFC6",
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginVertical: 5,
    width: "100%",
  },
  gameButtonText: {
    fontSize: 14,
    fontFamily: "Orbitron_700Bold",
    color: "#1A1A2E",
    textAlign: "center",
  },
  adButton: {
    backgroundColor: "#FFD60A",
    borderColor: "#FFB800",
    borderWidth: 2,
    shadowColor: "#FFD60A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
