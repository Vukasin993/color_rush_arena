import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Vibration,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from "@expo-google-fonts/orbitron";
import { useGame } from "../../store/useGameStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useNetwork } from "../../context/NetworkContext";
// import { logGameStart, logGameEnd } from "../../firebase/analytics";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { PauseModal } from "../../components/PauseModal";
import { CustomModal } from "../../components/CustomModal";
import { WordDisplay } from "./components/WordDisplay";
import { ColorButtons } from "./components/ColorButtons";

type ColorMatchEndlessGameProps = NativeStackScreenProps<
  RootStackParamList,
  "ColorMatchEndlessGame"
>;

interface ColorData {
  name: string;
  value: string;
  textColor: string;
}

const ENDLESS_COLORS = [
  { name: "RED", color: "#FF0000", value: "#FF0000", textColor: "#FF0000" },
  { name: "YELLOW", color: "#FFFF00", value: "#FFFF00", textColor: "#FFFF00" },
  { name: "BLUE", color: "#0000FF", value: "#0000FF", textColor: "#0000FF" },
  { name: "GREEN", color: "#008000", value: "#008000", textColor: "#008000" },
  { name: "ORANGE", color: "#FFA500", value: "#FFA500", textColor: "#FFA500" },
  { name: "PURPLE", color: "#800080", value: "#800080", textColor: "#800080" },
];

interface GameState {
  score: number;
  questionsAnswered: number;
  currentWord: ColorData;
  currentTextColor: string;
  currentColors: ColorData[];
  gameStarted: boolean;
  gameOver: boolean;
  isPaused: boolean;
  showingWord: boolean;
  lastReactionTime: number;
  reactionFeedback: string;
  startTime: number;
  wrongAnswer: boolean;
}

const getScoreForReactionTime = (
  reactionTime: number
): { score: number; feedback: string } => {
  if (reactionTime <= 500) {
    return { score: 100, feedback: "Lightning! ⚡" };
  } else if (reactionTime <= 1000) {
    return { score: 80, feedback: "Fast! 🔥" };
  } else if (reactionTime <= 1500) {
    return { score: 50, feedback: "Good! ⭐" };
  } else if (reactionTime <= 2000) {
    return { score: 20, feedback: "OK 👍" };
  } else {
    return { score: 5, feedback: "Slow 💤" };
  }
};

const generateRandomQuestion = (): {
  word: ColorData;
  textColor: string;
  colors: ColorData[];
} => {
  // Pick a random word to display
  const word =
    ENDLESS_COLORS[Math.floor(Math.random() * ENDLESS_COLORS.length)];

  // Pick a different color to display the word in (this is the trick!)
  const textColorOptions = ENDLESS_COLORS.filter((c) => c.name !== word.name);
  const textColor =
    textColorOptions[Math.floor(Math.random() * textColorOptions.length)].value;

  return {
    word,
    textColor,
    colors: ENDLESS_COLORS, // Always show all 6 colors
  };
};

export const ColorMatchEndlessGame: React.FC<ColorMatchEndlessGameProps> = ({
  navigation,
}) => {
  const { addGameResult } = useGame();
  const updateGameStats = useAuthStore((state) => state.updateGameStats);
  const { isConnected, isInternetReachable } = useNetwork();

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    questionsAnswered: 0,
    currentWord: ENDLESS_COLORS[0],
    currentTextColor: ENDLESS_COLORS[1].value,
    currentColors: ENDLESS_COLORS,
    gameStarted: false,
    gameOver: false,
    isPaused: false,
    showingWord: false,
    lastReactionTime: 0,
    reactionFeedback: "",
    startTime: 0,
    wrongAnswer: false,
  });

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showWatchAdModal, setShowWatchAdModal] = useState(false);

  // Anti-slow play mechanism
  const gameStartTimeRef = useRef(Date.now());
  const pausedTimeRef = useRef(0); // Ukupno vreme pauze
  const pauseStartTimeRef = useRef(0); // Kada je started pause

  // Tracking klikova sa timestamps
  const clickTimestampsRef = useRef<number[]>([]);
  const [currentGameTime, setCurrentGameTime] = useState(0); // Vreme u sekundama
  const lastCheckedMinuteRef = useRef(-1); // Track koji minut smo poslednji put proverili

  // Animation values
  const shakeAnimation = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);
  const wordScale = useSharedValue(1);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  // Reset game start time when game starts
  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver) {
      gameStartTimeRef.current = Date.now();
    }
  }, [gameState.gameStarted, gameState.gameOver]);

  // Exit game when internet connection is lost
  useEffect(() => {
    const hasInternet =
      isConnected &&
      (isInternetReachable === null || isInternetReachable === true);

    if (gameState.gameStarted && !gameState.gameOver && !hasInternet) {
      // Internet lost - Exit game immediately
      console.log("⚠️ Internet lost during game - Exiting to home...");
      navigation.navigate("MainTabs");
    }
  }, [
    isConnected,
    isInternetReachable,
    gameState.gameStarted,
    gameState.gameOver,
    navigation,
  ]);

  // Game timer - updating every second
  // --- ONE CENTRAL GAME LOOP ---
  // Ovaj interval proverava vreme i tempo, sve u jednom ciklusu
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver || gameState.isPaused)
      return;

    const loop = setInterval(() => {
      const now = Date.now();
      const totalElapsedTime = now - gameStartTimeRef.current;
      const actualPlayTime = totalElapsedTime - pausedTimeRef.current;
      const timeInSeconds = Math.floor(actualPlayTime / 1000);
      setCurrentGameTime(timeInSeconds);

      // --- 1️⃣ Izračunaj trenutni minut igre ---
      const currentMinute = Math.floor(timeInSeconds / 60); // 0 = prvi minut, 1 = drugi, itd.

      // --- 5️⃣ Kada minut istekne, proveri da li je korisnik ispunio uslov ---
      // Proveri samo ako je prošao minut i nismo ga već proverili
      if (currentMinute > lastCheckedMinuteRef.current && timeInSeconds >= 60) {
        // Proveri prethodni minut (onaj koji se upravo završio)
        const completedMinute = currentMinute - 1;
        const minuteStartTime =
          gameStartTimeRef.current + completedMinute * 60000;
        const minuteEndTime = minuteStartTime + 60000;
        const minuteClicks = clickTimestampsRef.current.filter(
          (t) => t >= minuteStartTime && t < minuteEndTime
        );
        // Povećavaj za 1 svaki minut, max 60
        const minuteRequiredClicks = Math.min(30 + completedMinute, 60);

        console.log(
          `🔍 Checking completed minute ${completedMinute + 1}: ${
            minuteClicks.length
          }/${minuteRequiredClicks} clicks`
        );

        if (minuteClicks.length < minuteRequiredClicks) {
          console.log(
            `⚠️ SLOW PLAY! Only ${
              minuteClicks.length
            }/${minuteRequiredClicks} clicks in minute ${completedMinute + 1}`
          );

          // Mark this minute as checked
          lastCheckedMinuteRef.current = currentMinute;

          // Pause game and show modal
          setGameState((prev) => ({
            ...prev,
            wrongAnswer: false,
            isPaused: true, // Pauziramo igru dok se prikazuje modal
          }));
          setShowWatchAdModal(true);
        } else {
          console.log(
            `✅ Minute ${completedMinute + 1} PASSED! (${
              minuteClicks.length
            }/${minuteRequiredClicks})`
          );
          // Mark this minute as checked
          lastCheckedMinuteRef.current = currentMinute;
        }
      }
    }, 1000);

    return () => clearInterval(loop);
  }, [gameState.gameStarted, gameState.gameOver, gameState.isPaused]);

  // Generate new question
  const generateNewQuestion = useCallback(() => {
    const { word, textColor, colors } = generateRandomQuestion();
    setGameState((prev) => ({
      ...prev,
      currentWord: word,
      currentTextColor: textColor,
      currentColors: colors,
      showingWord: true,
      startTime: Date.now(),
    }));
  }, []);

  // Start game
  const startGame = useCallback(() => {
    // logGameStart("colorMatchEndless");

    // Reset click tracking
    clickTimestampsRef.current = [];
    gameStartTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    pauseStartTimeRef.current = 0;
    setCurrentGameTime(0);
    lastCheckedMinuteRef.current = -1; // Reset checked minutes

    setGameState((prev) => ({
      ...prev,
      gameStarted: true,
      gameOver: false,
      isPaused: false,
      wrongAnswer: false,
      score: 0,
      questionsAnswered: 0,
    }));
    generateNewQuestion();
  }, [generateNewQuestion]);

  // Handle color selection
  const handleColorPress = useCallback(
    (selectedColor: ColorData) => {
      if (!gameState.gameStarted || gameState.gameOver || gameState.isPaused)
        return;

      // Track click timestamp za sliding window
      const now = Date.now();
      clickTimestampsRef.current.push(Date.now());

      // Očisti stare klikove (starije od 5 minuta) da ne gomilamo memoriju
      const fiveMinutesAgo = now - 300000;
      clickTimestampsRef.current = clickTimestampsRef.current.filter(
        (timestamp) => timestamp > fiveMinutesAgo
      );

      const reactionTime = now - gameState.startTime;
      const isCorrect = selectedColor.name === gameState.currentWord.name;

      if (isCorrect) {
        // Correct answer
        const { score: pointsEarned, feedback } =
          getScoreForReactionTime(reactionTime);

        setGameState((prev) => ({
          ...prev,
          score: prev.score + pointsEarned,
          questionsAnswered: prev.questionsAnswered + 1,
          lastReactionTime: reactionTime,
          reactionFeedback: feedback,
          showingWord: true, // Keep showing word during transition
        }));

        // Show feedback animation
        feedbackOpacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );

        // Generate next question immediately - no delay
        generateNewQuestion();
      } else {
        // Wrong answer - Game Over
        Vibration.vibrate(300);

        // Shake animation
        shakeAnimation.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );

        setGameState((prev) => ({ ...prev, wrongAnswer: true }));
        setShowWatchAdModal(true);
      }
    },
    [
      gameState.gameStarted,
      gameState.gameOver,
      gameState.isPaused,
      gameState.startTime,
      gameState.currentWord.name,
      generateNewQuestion,
      feedbackOpacity,
      shakeAnimation,
    ]
  );

  // Handle game over (after watch ad modal)
  const handleGameOver = useCallback(async () => {
    setGameState((prev) => ({ ...prev, gameOver: true }));

    // logGameEnd("colorMatchEndless", gameState.score);

    // Save stats
    const xpEarned = Math.round(gameState.score * 1.5); // Endless mode gives more XP

    try {
      await updateGameStats(
        "colorMatchEndless",
        "easy", // Use easy as default level for endless
        gameState.score,
        xpEarned
      );

      addGameResult({
        gameType: "colorMatchEndless",
        level: "endless",
        score: gameState.score,
        xpEarned,
        duration: 0,
      });
    } catch (error) {
      console.error("Failed to update stats:", error);
    }

    // Navigate to game over screen
    navigation.replace("GameOverScreen", {
      gameType: "colorMatchEndless",
      score: gameState.score,
      xpEarned: xpEarned,
      questionsAnswered: gameState.questionsAnswered,
      level: "endless",
    });
  }, [
    gameState.score,
    gameState.questionsAnswered,
    updateGameStats,
    addGameResult,
    navigation,
  ]);

  // Watch ad to continue
  const handleWatchAd = useCallback(() => {
    setShowWatchAdModal(false);

    // Calculate current game time and round to seconds
    const now = Date.now();
    const totalElapsedTime = now - gameStartTimeRef.current;
    const actualPlayTime = totalElapsedTime - pausedTimeRef.current;
    const currentTimeInSeconds = Math.floor(actualPlayTime / 1000);

    // Calculate which minute we're currently in
    const currentMinute = Math.floor(currentTimeInSeconds / 60);

    // Update lastCheckedMinuteRef to the current minute so we continue from here
    lastCheckedMinuteRef.current = currentMinute;

    console.log(
      `🎬 Watched ad! Continuing from minute ${
        currentMinute + 1
      } (${currentTimeInSeconds}s). Required clicks: ${Math.min(
        30 + currentMinute,
        60
      )}`
    );

    // Unpause game and continue
    setGameState((prev) => ({
      ...prev,
      isPaused: false,
      wrongAnswer: false,
    }));

    // Continue game (simulate ad watched)
    generateNewQuestion();
  }, [generateNewQuestion]);

  // Animated styles
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
  }));

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#0F0F1B", "#1A1A2E", "#16213E"]}
        style={styles.background}
      />

      {!gameState.gameStarted ? (
        // Start Screen
        <ScrollView
          style={styles.startContainer}
          contentContainerStyle={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={styles.title}>∞ ENDLESS MODE</Text>
          <Text style={styles.subtitle}>React Fast for Max Points!</Text>

          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>How to Score:</Text>
            <Text style={styles.rulesText}>
              ⚡ 0-0.5s: 100 points (Lightning!)
            </Text>
            <Text style={styles.rulesText}>🔥 0.5-1.0s: 80 points (Fast!)</Text>
            <Text style={styles.rulesText}>⭐ 1.0-1.5s: 50 points (Good)</Text>
            <Text style={styles.rulesText}>👍 1.5-2.0s: 20 points (OK)</Text>
            <Text style={styles.rulesText}>💤 2.0s+: 5 points (Slow)</Text>

            <Text style={styles.warningTitle}>⚠️ Speed Requirement:</Text>
            <Text style={styles.warningText}>
              You must answer at least 30 questions per minute to continue
              playing. Playing too slowly will end the game!
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <LinearGradient
              colors={["#FF6B6B", "#FF4757"]}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>START ENDLESS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // Game Screen - Using same UI as ColorMatchGame
        <>
          {/* Custom Header for Endless Mode */}
          <View style={styles.endlessHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{gameState.score}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {gameState.questionsAnswered}
                </Text>
                <Text style={styles.statLabel}>Total Clicks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {gameState.lastReactionTime}ms
                </Text>
                <Text style={styles.statLabel}>Last Time</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={() => {
                // Postavi pause state i sačuvaj kada je started pause
                setGameState((prev) => ({ ...prev, isPaused: true }));
                pauseStartTimeRef.current = Date.now();
                setShowPauseModal(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="pause" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.gameArea, shakeStyle]}>
            {/* Game Timer */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                ⏱️ {Math.floor(currentGameTime / 60)}:
                {(currentGameTime % 60).toString().padStart(2, "0")}
              </Text>
              <Text
                style={
                  currentGameTime < 60 ? styles.warningText : styles.successText
                }
              >
                Next 60 seconds need{" "}
                {Math.min(30 + Math.floor(currentGameTime / 60), 60)}+ clicks
              </Text>
              <Text style={styles.successText}>
                Current minute:{" "}
                {(() => {
                  const currentMinute = Math.floor(currentGameTime / 60);
                  const minuteStartTime =
                    gameStartTimeRef.current + currentMinute * 60000;
                  const minuteEndTime = minuteStartTime + 60000;
                  const currentMinuteClicks = clickTimestampsRef.current.filter(
                    (t) => t >= minuteStartTime && t < minuteEndTime
                  ).length;
                  return currentMinuteClicks;
                })()}{" "}
                clicks
              </Text>
            </View>

            <WordDisplay
              currentWord={gameState.currentWord}
              currentTextColor={gameState.currentTextColor}
              pulseAnimation={wordScale}
              colors={gameState.currentColors}
            />
            <ColorButtons
              colors={gameState.currentColors}
              onColorPress={handleColorPress}
              isEndless={true}
            />

            {/* Reaction Feedback */}
            <Animated.View style={[styles.feedbackContainer, feedbackStyle]}>
              <Text style={styles.feedbackText}>
                {gameState.reactionFeedback}
              </Text>
            </Animated.View>
          </Animated.View>
        </>
      )}

      {/* Pause Modal */}
      <PauseModal
        visible={showPauseModal}
        onResume={() => {
          // Resume igru - dodaj pauzirано vreme i nastavi
          const pauseDuration = Date.now() - pauseStartTimeRef.current;
          pausedTimeRef.current += pauseDuration;
          setGameState((prev) => ({ ...prev, isPaused: false }));
          setShowPauseModal(false);
        }}
        onExit={() => {
          setShowPauseModal(false);
          navigation.navigate("MainTabs");
        }}
        onWatchAd={() => {
          // Resume igru kroz "reklamu" - sačuvaj game state
          const pauseDuration = Date.now() - pauseStartTimeRef.current;
          pausedTimeRef.current += pauseDuration;
          setGameState((prev) => ({ ...prev, isPaused: false }));
          setShowPauseModal(false);
        }}
      />

      {/* Watch Ad Modal */}
      <CustomModal
        visible={showWatchAdModal}
        onClose={() => {}}
        title={gameState.wrongAnswer ? "Wrong Answer!" : "Playing Too Slowly!"}
        message={
          gameState.wrongAnswer
            ? `Your Score: ${gameState.score}\n\nWatch an ad to continue playing or end the game?`
            : `Your Score: ${gameState.score}\n\nYou didn't reach the required speed!\n\nWatch ad & continue or end the game?`
        }
        icon="alert-circle"
        buttons={[
          {
            text: "End Game",
            style: "secondary",
            onPress: handleGameOver,
          },
          {
            text: "Watch Ad & Continue",
            style: "primary",
            onPress: handleWatchAd,
          },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1B",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 25,
    backgroundColor: "rgba(142, 45, 226, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  pauseButton: {
    width: 32,
    height: 32,
    borderRadius: 25,
    backgroundColor: "rgba(142, 45, 226, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  startContainer: {
    flex: 1,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: "Orbitron_700Bold",
    color: "#FF6B6B",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    textShadowColor: "#FF6B6B",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Orbitron_400Regular",
    color: "#B8B8D1",
    textAlign: "center",
    marginBottom: 24,
  },
  rulesContainer: {
    backgroundColor: "rgba(26, 26, 46, 0.6)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
    width: "100%",
  },
  rulesTitle: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    color: "#FF6B6B",
    marginBottom: 15,
    textAlign: "center",
  },
  rulesText: {
    fontSize: 16,
    fontFamily: "Orbitron_400Regular",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "left",
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: "Orbitron_700Bold",
    color: "#FFD60A",
    marginTop: 15,
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "#FFD60A",
    textShadowRadius: 5,
  },
  warningText: {
    fontSize: 13,
    fontFamily: "Orbitron_400Regular",
    color: "#00FFC6",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 0,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
  },
  timerText: {
    fontSize: 24,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFC6",
    marginBottom: 6,
    textAlign: "center",
    textShadowColor: "#00FFC6",
    textShadowRadius: 10,
  },
  successText: {
    fontSize: 12,
    fontFamily: "Orbitron_400Regular",
    color: "#00FFC6",
    textAlign: "center",
    marginTop: 5,
  },
  startButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    marginBottom: 32,
  },
  startButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 60,
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
  gameContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
    backgroundColor: "rgba(26, 26, 46, 0.6)",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(142, 45, 226, 0.3)",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 12,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Orbitron_400Regular",
    color: "#B8B8D1",
  },
  wordContainer: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    borderRadius: 20,
    padding: 40,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  wordText: {
    fontSize: 48,
    fontFamily: "Orbitron_700Bold",
    textAlign: "center",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  colorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  colorButton: {
    width: "47%",
    height: 80,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  feedbackContainer: {
    position: "absolute",
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none",
  },
  feedbackText: {
    fontSize: 24,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFC6",
    textAlign: "center",
    textShadowColor: "#00FFC6",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  gameArea: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },
  endlessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "rgba(26, 26, 46, 0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(142, 45, 226, 0.3)",
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
});
