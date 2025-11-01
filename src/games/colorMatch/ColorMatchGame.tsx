import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StatusBar,
  Vibration,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation, // ✅
} from "react-native-reanimated";
import { useGame } from "../../store/useGameStore";
import { useNetwork } from "../../context/NetworkContext";
import { useInterstitialAd } from "../../hooks/useInterstitialAd";
import { useRewardedAd } from "../../hooks/useRewardedAd";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";

// Import components
import { GameStartScreen } from "./components/GameStartScreen";
import { GameHeader } from "./components/GameHeader";
import { WordDisplay } from "./components/WordDisplay";
import { ColorButtons } from "./components/ColorButtons";
import { PauseModal } from "../../components/PauseModal";

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

// XP calculation function
const calculateXPEarned = (score: number, level: 'easy' | 'medium' | 'hard'): number => {
  const baseXP = score * 10;
  const levelMultiplier = level === 'easy' ? 1 : level === 'medium' ? 1.5 : 2;
  const bonus = score > 20 ? 100 : 0;
  return Math.round(baseXP * levelMultiplier + bonus);
};

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

const getGameDuration = (level: string, bonusTime: number = 0) => {
  let baseDuration: number;
  switch (level) {
    case 'easy':
      baseDuration = 30;
      break;
    case 'medium':
      baseDuration = 45;
      break;
    case 'hard':
      baseDuration = 60;
      break;
    default:
      baseDuration = 30;
      break;
  }
  return baseDuration + bonusTime;
};

export const ColorMatchGame: React.FC<ColorMatchGameProps> = ({
  navigation,
  route,
}) => {
  const { level = "easy", autoStart = false, bonusTime = 0 } = route.params || {};
  const GAME_DURATION = getGameDuration(level, bonusTime);
  const { startGame, endGame, updateScore } = useGame();
  const { isConnected, isInternetReachable } = useNetwork();
  const { loaded: interstitialLoaded, showAd: showInterstitialAd } = useInterstitialAd();
  const { loaded: rewardedAdLoaded, showAd: showRewardedAd } = useRewardedAd();

  const COLORS = getColorsForLevel(level);
  const [currentWord, setCurrentWord] = useState<ColorData>(COLORS[0]);
  const [currentTextColor, setCurrentTextColor] = useState<string>(
    COLORS[1].value
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseAdsWatched, setPauseAdsWatched] = useState(0); // Track pause ads (max 1)
  const [displayScore, setDisplayScore] = useState(0); // For UI display

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

  // --- TIMER, PAUSE, RESUME & WATCH AD LOGIKA ---

const handlePause = () => {
  if (!gameStarted || isPaused) return;

  // Zapamti trenutno vreme
  timeLeftRef.current = timeLeft;
  console.log(`⏸️ Paused at ${timeLeftRef.current}s`);

  // Stopiraj interval
  if (intervalRef.current) {
    clearInterval(intervalRef.current as NodeJS.Timeout);
    intervalRef.current = null;
  }

  setIsPaused(true);
  setShowPauseModal(true);
};

const handleResume = (resumeTime?: number) => {
  // Vrati vreme ako je prosleđeno
  if (resumeTime !== undefined) {
    timeLeftRef.current = resumeTime;
    setTimeLeft(resumeTime);
  }

  console.log(`▶️ Resuming at ${timeLeftRef.current}s`);
  setShowPauseModal(false);
  setIsPaused(false);
};

const handleWatchAd = async () => {
  if (rewardedAdLoaded) {
    const savedTime = timeLeftRef.current; // ⏱ Zapamti vreme pre reklame

    const earned = await showRewardedAd();

    if (earned) {
      console.log("✅ Reward granted — resume from exact same time:", savedTime);
      setPauseAdsWatched(1);
      handleResume(savedTime); // Nastavi sa istim vremenom
    } else {
      console.log("❌ Ad closed — still paused");
    }
  } else {
    console.warn("⚠️ Ad not loaded — resume anyway");
    handleResume(timeLeftRef.current);
  }
};

// TIMER - jednostavan i precizan interval
const handleGameOver = useCallback(async () => {
  if (!gameStarted) return;
  
  // Clear any ongoing intervals
  if (intervalRef.current) {
    clearInterval(intervalRef.current as NodeJS.Timeout);
    intervalRef.current = null;
  }

  const score = scoreRef.current; // ✅ Use scoreRef as source of truth
  const xpEarned = calculateXPEarned(score, level);

  setGameStarted(false);
  endGame(score);
  
  // Show interstitial ad with 15% chance
  const showAd = Math.random() < 0.15; // 15% chance
  if (showAd && interstitialLoaded) {
    console.log('📺 Showing interstitial ad (15% chance)');
    await showInterstitialAd();
  }
  
  console.log('✅ GameOver - navigating with:', { gameType: 'colorMatch', level, score, xpEarned });
  
  navigation.replace('GameOverScreen', {
    gameType: 'colorMatch',
    level,
    score,
    xpEarned,
  });
}, [gameStarted, level, endGame, navigation, interstitialLoaded, showInterstitialAd]);

useEffect(() => {
  if (gameStarted && !isPaused) {
    intervalRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current <= 0) {
        clearInterval(intervalRef.current as NodeJS.Timeout);
        handleGameOver();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }
}, [gameStarted, isPaused, handleGameOver]);

  // Exit game when internet connection is lost
  useEffect(() => {
    const hasInternet = isConnected && (isInternetReachable === null || isInternetReachable === true);
    
    if (gameStarted && !hasInternet) {
      console.log('⚠️ Internet lost during game - Exiting to home...');
      navigation.navigate('MainTabs');
    }
  }, [isConnected, isInternetReachable, gameStarted, navigation]);


  const handleExitGame = () => {
    setShowPauseModal(false);
    setIsPaused(false);
    setGameStarted(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current as NodeJS.Timeout);
      intervalRef.current = null;
    }
    
    navigation.goBack();
  };

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setTimeLeft(GAME_DURATION);
    timeLeftRef.current = GAME_DURATION;
    startTimeRef.current = Date.now();
    scoreRef.current = 0;
    startGame("colorMatch", level);
    generateNewRound();
  }, [startGame, level, generateNewRound, GAME_DURATION]);

  useEffect(() => {
    if (autoStart && !gameStarted) {
      handleStartGame();
    }
  }, [autoStart, gameStarted, handleStartGame]);


  // 🔹 Color press logic
  const handleColorPress = useCallback(
    (selectedColor: ColorData) => {
      if (!gameStarted || timeLeftRef.current <= 0) return;
      const isCorrect = selectedColor.name === currentWord.name;

      if (isCorrect) {
        scoreRef.current += 1;
        setDisplayScore(scoreRef.current); // ✅ Update UI
        updateScore(1); // Async store update

        pulseAnimation.value = withSequence(
          withTiming(1.2, { duration: 100 }),
          withTiming(1, { duration: 100 })
        );

        Vibration.vibrate(50);
        generateNewRound();
      } else {
        scoreRef.current -= 1;
        setDisplayScore(scoreRef.current); // ✅ Update UI
        updateScore(-1); // Async store update

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
    ]
  );

  // 🔹 Cleanup all on unmount (important!)
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      cancelAnimation(pulseAnimation);
      cancelAnimation(shakeAnimation);
    };
  }, [pulseAnimation, shakeAnimation]);

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
        score={displayScore}
        totalTime={GAME_DURATION}
        onPause={handlePause}
        pauseAdsWatched={pauseAdsWatched}
      />
      <Animated.View style={[styles.gameArea, shakeStyle]}>
        <WordDisplay
          currentWord={currentWord}
          currentTextColor={currentTextColor}
          pulseAnimation={pulseAnimation}
          colors={COLORS}
        />
        <ColorButtons colors={COLORS} onColorPress={handleColorPress} />
      </Animated.View>

      {pauseAdsWatched === 0 && <PauseModal
        visible={showPauseModal}
        showWatchAd={pauseAdsWatched === 0} // Only show watch ad first time
        onResume={handleResume}
        onWatchAd={handleWatchAd}
        onExit={handleExitGame}
      />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1B" },
  gameArea: { flex: 1, justifyContent: "flex-start", padding: 20 },
});
