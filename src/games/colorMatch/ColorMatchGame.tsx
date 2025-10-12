import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StatusBar,
  Vibration,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation, // ✅
} from "react-native-reanimated";
import { useGame } from "../../store/useGameStore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";

// Import components
import { GameStartScreen } from "./components/GameStartScreen";
import { GameHeader } from "./components/GameHeader";
import { WordDisplay } from "./components/WordDisplay";
import { ColorButtons } from "./components/ColorButtons";

type ColorMatchGameProps = NativeStackScreenProps<
  RootStackParamList,
  "ColorMatchGame"
>;

interface ColorData {
  name: string;
  value: string;
  textColor: string;
}

const ALL_COLORS = [
  { name: "RED", value: "#FF3B30", textColor: "#FF6B6B" },
  { name: "GREEN", value: "#00FF88", textColor: "#00FFC6" },
  { name: "BLUE", value: "#007AFF", textColor: "#4FC3F7" },
  { name: "YELLOW", value: "#FFD60A", textColor: "#FFE066" },
  { name: "PURPLE", value: "#8E2DE2", textColor: "#B794F6" },
  { name: "ORANGE", value: "#FF9500", textColor: "#FFB84D" },
  { name: "PINK", value: "#FF2D92", textColor: "#FF69B4" },
  { name: "CYAN", value: "#00C7BE", textColor: "#4FD1C7" },
];

const getColorsForLevel = (level: "easy" | "medium" | "hard"): ColorData[] => {
  switch (level) {
    case "easy":
      return ALL_COLORS.slice(0, 4);
    case "medium":
      return ALL_COLORS.slice(0, 6);
    case "hard":
      return ALL_COLORS;
    default:
      return ALL_COLORS.slice(0, 4);
  }
};

const GAME_DURATION = 30;

export const ColorMatchGame: React.FC<ColorMatchGameProps> = ({
  navigation,
  route,
}) => {
  const { level = "easy", autoStart = false } = route.params || {};
  const { currentGame, startGame, endGame, updateScore } = useGame();

  const COLORS = getColorsForLevel(level);
  const [currentWord, setCurrentWord] = useState<ColorData>(COLORS[0]);
  const [currentTextColor, setCurrentTextColor] = useState<string>(
    COLORS[1].value
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  const timeLeftRef = useRef(GAME_DURATION);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | number | null>(null); // ✅ keep reference for cleanup

  // 🔹 Shared animations
  const pulseAnimation = useSharedValue(1);
  const shakeAnimation = useSharedValue(0);

  const generateNewRound = useCallback(() => {
    const wordIndex = Math.floor(Math.random() * COLORS.length);
    const textColorIndex = Math.floor(Math.random() * COLORS.length);
    setCurrentWord(COLORS[wordIndex]);
    setCurrentTextColor(COLORS[textColorIndex].value);
  }, [COLORS]);

  const scoreRef = useRef(0);

  // 🔹 Game Over — stop animations before navigating
  const handleGameOver = useCallback(() => {
    // ✅ Cancel animations before navigating
    cancelAnimation(pulseAnimation);
    cancelAnimation(shakeAnimation);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const finalScore = scoreRef.current;
    endGame(finalScore);
    console.log("Game Over! Final Score:", finalScore);

    navigation.navigate("GameOverScreen", {
      gameType: "colorMatch",
      level,
      score: finalScore,
      xpEarned: finalScore * 10 + (finalScore > 20 ? 100 : 0),
    });
  }, [endGame, navigation, level, pulseAnimation, shakeAnimation]);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setTimeLeft(GAME_DURATION);
    timeLeftRef.current = GAME_DURATION;
    startTimeRef.current = Date.now();
    scoreRef.current = 0;
    startGame("colorMatch", level);
    generateNewRound();
  }, [startGame, level, generateNewRound]);

  useEffect(() => {
    if (autoStart && !gameStarted) {
      handleStartGame();
    }
  }, [autoStart, gameStarted, handleStartGame]);

  // 🔹 Timer effect with real time tracking
  useEffect(() => {
    if (gameStarted) {
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - (startTimeRef.current ?? 0)) / 1000;
        const remaining = Math.max(0, GAME_DURATION - Math.floor(elapsed));
        setTimeLeft(remaining);
        timeLeftRef.current = remaining;

        if (remaining <= 0) {
          handleGameOver();
        }
      }, 250);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [gameStarted, handleGameOver]);

  // 🔹 Color press logic
  const handleColorPress = useCallback(
    (selectedColor: ColorData) => {
      if (!gameStarted || timeLeftRef.current <= 0) return;
      const isCorrect = selectedColor.name === currentWord.name;

      if (isCorrect) {
        updateScore(1);
        scoreRef.current = currentGame.score + 1;

        pulseAnimation.value = withSequence(
          withTiming(1.2, { duration: 100 }),
          withTiming(1, { duration: 100 })
        );

        Vibration.vibrate(50);
        generateNewRound();
      } else {
        updateScore(-1);
        scoreRef.current = currentGame.score - 1;

        shakeAnimation.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withRepeat(withTiming(10, { duration: 50 }), 3, true),
          withTiming(0, { duration: 50 })
        );

        Vibration.vibrate([100, 50, 100]);
      }
    },
    [
      gameStarted,
      currentWord.name,
      updateScore,
      generateNewRound,
      pulseAnimation,
      shakeAnimation,
      currentGame.score,
    ]
  );

  // 🔹 Cleanup all on unmount (important!)
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      cancelAnimation(pulseAnimation);
      cancelAnimation(shakeAnimation);
    };
  }, []);

  // 🔹 Animated styles
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
      <GameHeader
        timeLeft={timeLeft}
        score={currentGame.score}
        totalTime={GAME_DURATION}
      />
      <Animated.View style={[styles.gameArea, shakeStyle]}>
        <WordDisplay
          currentWord={currentWord}
          currentTextColor={currentTextColor}
          pulseAnimation={pulseAnimation}
        />
        <ColorButtons colors={COLORS} onColorPress={handleColorPress} />
      </Animated.View>
      <TouchableOpacity
        style={styles.pauseButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["rgba(142, 45, 226, 0.3)", "rgba(74, 0, 224, 0.3)"]}
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
  container: { flex: 1, backgroundColor: "#0F0F1B" },
  gameArea: { flex: 1, justifyContent: "center", padding: 20 },
  pauseButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    borderRadius: 15,
    elevation: 8,
    shadowColor: "#8E2DE2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pauseButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(142, 45, 226, 0.5)",
  },
  pauseButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
});
