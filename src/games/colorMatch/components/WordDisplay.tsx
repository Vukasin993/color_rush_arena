import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';

interface ColorData {
  name: string;
  value: string;
  textColor: string;
}

interface WordDisplayProps {
  currentWord: ColorData;
  currentTextColor: string;
  pulseAnimation: any;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({
  currentWord,
  currentTextColor,
  pulseAnimation,
}) => {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  if (!fontsLoaded) return null;

  return (
    <View style={styles.wordContainer}>
      <Text style={styles.instructionText}>What COLOR is this WORD?</Text>
      <Animated.View style={pulseStyle}>
        <Text
          style={[
            styles.colorWord,
            { color: currentTextColor }
          ]}
        >
          {currentWord.name}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wordContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    marginBottom: 20,
  },
  colorWord: {
    fontSize: 48,
    fontFamily: 'Orbitron_700Bold',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 2,
  },
});