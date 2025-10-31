import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from "@expo-google-fonts/orbitron";

interface ColorData {
  name: string;
  value: string;
  textColor: string;
}

interface GameStartScreenProps {
  level: "easy" | "medium" | "hard";
  colors: ColorData[];
  onStartGame: () => void;
  onGoBack: () => void;
}

export const GameStartScreen: React.FC<GameStartScreenProps> = ({
  level,
  colors,
  onStartGame,
  onGoBack,
}) => {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onGoBack}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#8E2DE2", "#4A00E0"]}
          style={styles.backButtonGradient}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView
        style={styles.startContainer}
        contentContainerStyle={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={styles.gameTitle}>🎨 Color Match</Text>
        <Text style={styles.gameSubtitle}>Test Your Focus</Text>

        {/* Level Info */}
        <View style={styles.levelInfoContainer}>
          <Text style={styles.levelTitle}>
            {level.toUpperCase()} LEVEL
            {level === "medium" && " (6 COLORS)"}
            {level === "hard" && " (8 COLORS)"}
          </Text>
          <Text style={styles.levelDescription}>
            {level === "easy" && "Perfect for beginners - 4 colors in 2x2 grid"}
            {level === "medium" && "More challenging - 6 colors in 3x2 grid"}
            {level === "hard" && "Ultimate test - 8 colors in 4x2 grid!"}
          </Text>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Play:</Text>
          <Text style={styles.instructionsText}>
            • A color word will appear in a different color{"\n"}• Tap the
            button matching the WORD, not the text color{"\n"}• Correct answer:
            +1 point{"\n"}• Wrong answer: -1 point{"\n"}• You have 30 seconds!
          </Text>
          <Text style={styles.difficultyText}>
            Colors: {colors.length} | Grid: {Math.ceil(colors.length / 2)}×2
          </Text>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartGame}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#00FFC6", "#00D4AA"]}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startButtonText}>START GAME</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1001,
    borderRadius: 25,
    elevation: 8,
    shadowColor: "#8E2DE2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  backButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  startContainer: {
    flex: 1,
    padding: 20,
  },
  gameTitle: {
    fontSize: 32,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "#8E2DE2",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginTop: 48
  },
  gameSubtitle: {
    fontSize: 18,
    fontFamily: "Orbitron_400Regular",
    color: "#B8B8D1",
    textAlign: "center",
    marginBottom: 24,
  },
  instructionsContainer: {
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    borderRadius: 20,
    padding: 25,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(142, 45, 226, 0.3)",
    width: "100%",
  },
  instructionsTitle: {
    fontSize: 20,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFC6",
    marginBottom: 15,
    textAlign: "center",
    textShadowColor: "#00FFC6",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  instructionsText: {
    fontSize: 16,
    fontFamily: "Orbitron_400Regular",
    color: "#FFFFFF",
    lineHeight: 24,
    textAlign: "left",
  },
  startButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: "#00FFC6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    marginBottom: 48
  },
  startButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 25,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 20,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  levelInfoContainer: {
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 198, 0.3)",
    width: "100%",
    alignItems: "center",
  },
  levelTitle: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFC6",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "#00FFC6",
    textShadowRadius: 8,
  },
  levelDescription: {
    fontSize: 14,
    fontFamily: "Orbitron_400Regular",
    color: "#B8B8D1",
    textAlign: "center",
    lineHeight: 20,
  },
  difficultyText: {
    fontSize: 14,
    fontFamily: "Orbitron_700Bold",
    color: "#FFD60A",
    textAlign: "center",
    marginTop: 10,
    textShadowColor: "#FFD60A",
    textShadowRadius: 5,
  },
});
