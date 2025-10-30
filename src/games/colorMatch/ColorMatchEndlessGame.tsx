import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Vibration,
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
  isPaused: false;
  showingWord: boolean;
  lastReactionTime: number;
  reactionFeedback: string;
  startTime: number;
}

const getScoreForReactionTime = (
  reactionTime: number
): { score: number; feedback: string } => {
  if (reactionTime <= 500) {
    return { score: 100, feedback: "Lightning! ⚡" };
  } else if (reactionTime <= 1000) {
    return { score: 75, feedback: "Fast! 🔥" };
  } else if (reactionTime <= 1500) {
    return { score: 50, feedback: "Good! ⭐" };
  } else if (reactionTime <= 2000) {
    return { score: 30, feedback: "OK 👍" };
  } else {
    return { score: 15, feedback: "Slow 💤" };
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
  });

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showWatchAdModal, setShowWatchAdModal] = useState(false);

  // Animation values
  const shakeAnimation = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);
  const wordScale = useSharedValue(1);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

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
    setGameState((prev) => ({
      ...prev,
      gameStarted: true,
      gameOver: false,
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

      const reactionTime = Date.now() - gameState.startTime;
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
        <View style={styles.startContainer}>
          <Text style={styles.title}>∞ ENDLESS MODE</Text>
          <Text style={styles.subtitle}>React Fast for Max Points!</Text>

          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>How to Score:</Text>
            <Text style={styles.rulesText}>
              ⚡ 0-0.5s: 100 points (Lightning!)
            </Text>
            <Text style={styles.rulesText}>🔥 0.5-1.0s: 75 points (Fast!)</Text>
            <Text style={styles.rulesText}>⭐ 1.0-1.5s: 50 points (Good)</Text>
            <Text style={styles.rulesText}>👍 1.5-2.0s: 30 points (OK)</Text>
            <Text style={styles.rulesText}>💤 2.0s+: 15 points (Slow)</Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <LinearGradient
              colors={["#FF6B6B", "#FF4757"]}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>START ENDLESS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pauseButton}
              onPress={() => setShowPauseModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pause" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gameState.score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {gameState.questionsAnswered}
              </Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {gameState.lastReactionTime}ms
              </Text>
              <Text style={styles.statLabel}>Last Time</Text>
            </View>
          </View>
          <Animated.View style={[styles.gameArea, shakeStyle]}>
            <WordDisplay
              currentWord={gameState.currentWord}
              currentTextColor={gameState.currentTextColor}
              pulseAnimation={wordScale}
              colors={gameState.currentColors}
            />
            <ColorButtons
              colors={gameState.currentColors}
              onColorPress={handleColorPress}
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
        onResume={() => setShowPauseModal(false)}
        onExit={() => {
          setShowPauseModal(false);
          navigation.navigate("MainTabs");
        }}
        onWatchAd={() => {
          setShowPauseModal(false);
          startGame();
        }}
      />

      {/* Watch Ad Modal */}
      <CustomModal
        visible={showWatchAdModal}
        onClose={() => {}}
        title="Wrong Answer!"
        message={`Your Score: ${gameState.score}\n\nWatch an ad to continue playing or end the game?`}
        icon="alert-circle"
        buttons={[
          {
            text: "End Game",
            style: "secondary",
            onPress: handleGameOver,
          },
          {
            text: "Watch Ad",
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(142, 45, 226, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  pauseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(142, 45, 226, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  startContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 36,
    fontFamily: "Orbitron_700Bold",
    color: "#FF6B6B",
    textAlign: "center",
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
    marginBottom: 40,
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
    fontSize: 14,
    fontFamily: "Orbitron_400Regular",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "left",
  },
  startButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
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
    marginBottom: 40,
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
    fontSize: 24,
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
    marginBottom: 60,
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
    marginBottom: 40,
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
    padding: 20,
  },
  endlessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "rgba(26, 26, 46, 0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(142, 45, 226, 0.3)",
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
});
