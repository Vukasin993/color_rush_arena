import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
} from "react-native-reanimated";
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from "@expo-google-fonts/orbitron";
import { useGame } from "../store/useGameStore";
import { useAuth } from "../store/useAuthStore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

type GameOverScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "GameOverScreen"
>;

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  navigation,
  route,
}) => {
  console.log('🎮 GameOverScreen rendered with params:', route.params);
  
  const { gameType, score, xpEarned, level } = route.params;
  const { colorMatchStats, reactionTapStats, resetCurrentGame } = useGame();
  const { user, updateGameStats } = useAuth();
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const initializedRef = useRef(false);

  console.log('👤 Current user in GameOverScreen:', user?.username || 'No user');
  console.log('📊 Game stats:', gameType === "colorMatch" ? colorMatchStats : reactionTapStats);

  const gameStats =
    gameType === "colorMatch" ? colorMatchStats : reactionTapStats;

  // Fallback stats if data is missing
  const safeGameStats = gameStats || {
    totalGames: 0,
    bestScore: 0,
    averageScore: 0,
    totalXP: 0,
    easyCompleted: 0,
    mediumCompleted: 0,
    hardCompleted: 0,
  };

  // Animation values
  const fadeAnimation = useSharedValue(0);
  const slideAnimation = useSharedValue(50);
  const scaleAnimation = useSharedValue(0);
  const xpAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  // Submit score to Firebase and update user stats
  const submitScoreToFirebase = React.useCallback(async () => {
    if (scoreSubmitted || score <= 0) {
      console.log('🚫 Skipping score submission:', { scoreSubmitted, score });
      return;
    }

    console.log('📤 Starting score submission...');

    // Immediately mark as submitted to prevent UI hanging
    setScoreSubmitted(true);

    try {
      // Update user stats in the new system - with timeout protection
      if (user && (gameType === 'colorMatch' || gameType === 'reactionTap') && level) {
        console.log('📊 Updating user game stats...', { gameType, level, score, xpEarned });
        try {
          // Add timeout protection for stats update
          const statsPromise = updateGameStats(gameType, level, score, xpEarned);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Stats update timeout')), 5000);
          });
          
          await Promise.race([statsPromise, timeoutPromise]);
          console.log('✅ User stats updated successfully');
        } catch (statsError) {
          console.error('❌ Failed to update user stats:', statsError);
          // Continue anyway - don't let stats error break the screen
          // Mark as submitted so we don't retry
          setScoreSubmitted(true);
        }
      } else {
        console.log('⚠️ Skipping user stats update:', { 
          hasUser: !!user, 
          gameType, 
          level, 
          validGameType: gameType === 'colorMatch' || gameType === 'reactionTap' 
        });
      }

      // Leaderboard is now handled automatically via user stats - no separate submission needed
      console.log('✅ Leaderboard data updated via user stats');

      console.log("✅ Score submission process completed");
    } catch (error) {
      console.error("❌ Failed to submit score:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      
      // Don't show alert if it's a Firebase Auth error - continue anyway
      if (error instanceof Error && !error.message.includes('auth')) {
        Alert.alert(
          "Score Submission Failed",
          "Could not save your score to the leaderboard. Check your internet connection.",
          [{ text: "OK" }]
        );
      }
    }
  }, [scoreSubmitted, score, gameType, level, xpEarned, user, updateGameStats]);

useEffect(() => {
  console.log('🎮 GameOverScreen initializing (always)');
  resetCurrentGame();

  // Animacije neka se uvek pokrenu kad se ekran otvori
  fadeAnimation.value = withTiming(1, { duration: 800 });
  slideAnimation.value = withTiming(0, { duration: 800 });
  scaleAnimation.value = withDelay(
    300,
    withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 200 })
    )
  );
  xpAnimation.value = withDelay(800, withTiming(1, { duration: 1000 }));
  glowAnimation.value = withTiming(1, { duration: 1500 });

  setTimeout(() => {
    submitScoreToFirebase().catch((error) =>
      console.error('❌ Score submission failed, but UI continues:', error)
    );
  }, 100);

  return () => {
    console.log('🧹 GameOverScreen cleanup');
    fadeAnimation.value = 0;
    slideAnimation.value = 0;
    scaleAnimation.value = 0;
    xpAnimation.value = 0;
    glowAnimation.value = 0;
  };
}, [
  fadeAnimation,
  slideAnimation,
  scaleAnimation,
  xpAnimation,
  glowAnimation,
  resetCurrentGame,
  submitScoreToFirebase,
]);


  console.log('✅ GameOverScreen main render');
  const getGameInfo = () => {
    switch (gameType) {
      case "colorMatch":
        return {
          title: "Color Match",
          emoji: "🎨",
          color: ["#FF6B6B", "#FF3B30"] as [string, string],
        };
      case "reactionTap":
        return {
          title: "Reaction Tap",
          emoji: "⚡",
          color: ["#FFD60A", "#FFB800"] as [string, string],
        };
      case "colorSnake":
        return {
          title: "Color Snake",
          emoji: "🐍",
          color: ["#00FFC6", "#00D4AA"] as [string, string],
        };
      default:
        return {
          title: "Game",
          emoji: "🎮",
          color: ["#8E2DE2", "#4A00E0"] as [string, string],
        };
    }
  };

  const gameInfo = getGameInfo();
  const isNewBest = score === safeGameStats.bestScore && score > 0;

  const getScoreMessage = () => {
    if (score <= 0) return "Keep practicing!";
    if (score < 10) return "Good start!";
    if (score < 20) return "Great job!";
    if (score < 30) return "Excellent!";
    return "LEGENDARY!";
  };

  // --- ANIMATED STYLES ---

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnimation.value,
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnimation.value }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnimation.value }],
  }));

  // ✅ Fixed XP bar animation using interpolate
  const xpStyle = useAnimatedStyle(() => ({
    width: `${interpolate(xpAnimation.value, [0, 1], [0, 100])}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    textShadowColor: gameInfo.color[0],
    textShadowRadius: interpolate(glowAnimation.value, [0, 1], [0, 20]),
    textShadowOffset: { width: 0, height: 0 },
  }));

    console.log('✅ GameOverScreen main render 1');

  if (!fontsLoaded) {
    console.log('⏳ Fonts not loaded yet...');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  console.log('✅ GameOverScreen main render 2');

  // Safety check for route params
  if (!route?.params) {
    console.error('❌ GameOverScreen: Missing route params');
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading game results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🎨 fadeAnimation:', fadeAnimation.value);

  console.log('✅ GameOverScreen rendering main content 3');
console.log('🎨 Opacity:', fadeAnimation.value);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
      <ScrollView contentContainerStyle={{ flexGrow: 1,  }}>
        <Animated.View style={[styles.content, fadeStyle]}>
          {/* HEADER */}
          <Animated.View style={[styles.header, slideStyle]}>
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.gameTitle}>
              {gameInfo.emoji} {gameInfo.title}
            </Text>
          </Animated.View>

          {/* SCORE */}
          <Animated.View style={[styles.scoreSection, scaleStyle]}>
            <LinearGradient
              colors={gameInfo.color}
              style={styles.scoreContainer}
            >
              <Text style={styles.scoreLabel}>Final Score</Text>
              <Animated.Text style={[styles.scoreValue, glowStyle]}>
                {score}
              </Animated.Text>
              <Text style={styles.scoreMessage}>{getScoreMessage()}</Text>

              {isNewBest && (
                <View style={styles.newBestBadge}>
                  <Text style={styles.newBestText}>🏆 NEW BEST!</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* XP */}
          <Animated.View style={[styles.xpSection, slideStyle]}>
            <Text style={styles.xpLabel}>XP Earned</Text>
            <View style={styles.xpContainer}>
              <View style={styles.xpBarBg}>
                <Animated.View style={[styles.xpBar, xpStyle]} />
              </View>
              <Text style={styles.xpValue}>+{xpEarned} XP</Text>
            </View>
          </Animated.View>

          {/* STATS */}
          <Animated.View style={[styles.statsSection, slideStyle]}>
            <Text style={styles.statsTitle}>Your Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeGameStats.totalGames}</Text>
                <Text style={styles.statLabel}>Games Played</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeGameStats.bestScore}</Text>
                <Text style={styles.statLabel}>Best Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeGameStats.averageScore}</Text>
                <Text style={styles.statLabel}>Average</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeGameStats.totalXP}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
            </View>
          </Animated.View>

          {/* BUTTONS */}
          <Animated.View style={[styles.buttonsContainer, slideStyle]}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: "MainTabs" },
                    {
                      name:
                        gameType === "colorMatch"
                          ? "ColorMatchGame"
                          : "ReactionGame",
                      params: { level: level || "easy", autoStart: true },
                    },
                  ],
                });
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gameInfo.color}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Play Again</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "MainTabs" }],
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="home" size={20} color="#B8B8D1" />
              <Text style={styles.homeButtonText}>Home</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1B",
    
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0F0F1B",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#8E2DE2",
    fontSize: 18,
    fontFamily: "Orbitron_400Regular",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  gameOverTitle: {
    fontSize: 32,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "#8E2DE2",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  gameTitle: {
    fontSize: 20,
    fontFamily: "Orbitron_400Regular",
    color: "#B8B8D1",
    textAlign: "center",
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  scoreContainer: {
    width: "100%",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scoreLabel: {
    fontSize: 16,
    fontFamily: "Orbitron_400Regular",
    color: "#FFFFFF",
    marginBottom: 10,
    opacity: 0.8,
  },
  scoreValue: {
    fontSize: 48,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scoreMessage: {
    fontSize: 14,
    fontFamily: "Orbitron_400Regular",
    color: "#FFFFFF",
    marginTop: 10,
    opacity: 0.9,
  },
  newBestBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 15,
  },
  newBestText: {
    fontSize: 14,
    fontFamily: "Orbitron_700Bold",
    color: "#000000",
  },
  xpSection: {
    marginBottom: 30,
  },
  xpLabel: {
    fontSize: 16,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFC6",
    textAlign: "center",
    marginBottom: 15,
    textShadowColor: "#00FFC6",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  xpContainer: {
    alignItems: "center",
  },
  xpBarBg: {
    width: "100%",
    height: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 10,
  },
  xpBar: {
    height: "100%",
    backgroundColor: "#00FFC6",
    borderRadius: 6,
    transformOrigin: "left", // <- bitno za scaleX
  },
  xpValue: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFC6",
    textShadowColor: "#00FFC6",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  statsSection: {
    marginBottom: 40,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  statItem: {
    width: "48%",
    backgroundColor: "rgba(26,26,46,0.6)",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(142,45,226,0.3)",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Orbitron_400Regular",
    color: "#B8B8D1",
    textAlign: "center",
  },
  buttonsContainer: {
    gap: 15,
  },
  primaryButton: {
    borderRadius: 25,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(184,184,209,0.1)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(184,184,209,0.3)",
    paddingVertical: 14,
    paddingHorizontal: 40,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 14,
    fontFamily: "Orbitron_400Regular",
    color: "#B8B8D1",
  },
});
