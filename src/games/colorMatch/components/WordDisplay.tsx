import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
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

interface WordDisplayProps {
  currentWord: ColorData;
  currentTextColor: string;
  pulseAnimation: any;
  colors: ColorData[];
}

export const WordDisplay: React.FC<WordDisplayProps> = ({
  currentWord,
  currentTextColor,
  pulseAnimation,
  colors,
}) => {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  // ✅ Pulse animacija — bez .value u JSX
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  if (!fontsLoaded) return null;

  return (
    <View style={{ ...styles.wordContainer, marginBottom: colors?.length > 4 ? 20 : 60 }}>
      <Animated.Text style={[styles.instructionText, { fontSize: colors?.length > 4 ? 12 : 16 }]}>
        What COLOR is this WORD?
      </Animated.Text>

      {/* ✅ Umesto <Animated.View> + <Text> → jedan Animated.Text */}
      <Animated.Text
        style={[styles.colorWord, animatedStyle, { color: currentTextColor, fontSize: colors?.length > 4 ? 32 : 48 }]}
      >
        {currentWord.name}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wordContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  instructionText: {
    fontFamily: "Orbitron_400Regular",
    color: "#B8B8D1",
    textAlign: "center",
    marginBottom: 10,
  },
  colorWord: {
    fontFamily: "Orbitron_700Bold",
    textAlign: "center",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 2,
  },
});
