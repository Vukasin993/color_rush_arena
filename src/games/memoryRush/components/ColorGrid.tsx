import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,

} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import { GameColor } from '../MemoryRushGame';

interface ColorGridProps {
  colors: GameColor[];
  onColorPress: (colorId: string) => void;
  disabled: boolean;
  gridSize: { rows: number; cols: number };
  playerInput: string[];
  correctSequence: string[];
}

export const ColorGrid: React.FC<ColorGridProps> = ({
  colors,
  onColorPress,
  disabled,
  gridSize,
  playerInput,
  correctSequence,
}) => {
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  const renderColorButton = (color: GameColor, index: number) => {
    const isLastInput = playerInput.length > 0 && playerInput[playerInput.length - 1] === color.id;
    const isCorrectSoFar = playerInput.length <= correctSequence.length && 
                          playerInput.every((input, i) => input === correctSequence[i]);
    
    return (
      <TouchableOpacity
        key={color.id}
        style={[
          styles.colorButton,
          {
            width: `${90 / gridSize.cols}%`,
            aspectRatio: 1,
          }
        ]}
        onPress={() => {
          console.log('Color pressed:', color.id, 'disabled:', disabled);
          onColorPress(color.id);
        }}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <LinearGradient
          colors={[color.color, color.color]}
          style={[
            styles.colorButtonGradient,
            disabled && styles.colorButtonDisabled,
            isLastInput && !isCorrectSoFar && styles.colorButtonError,
          ]}
        >
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Organize colors into grid
  const colorGrid: GameColor[][] = [];
  for (let row = 0; row < gridSize.rows; row++) {
    colorGrid[row] = [];
    for (let col = 0; col < gridSize.cols; col++) {
      const index = row * gridSize.cols + col;
      if (index < colors.length) {
        colorGrid[row].push(colors[index]);
      }
    }
  }

  return (
    <View style={styles.container}>
      {colorGrid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((color, colIndex) => 
            renderColorButton(color, rowIndex * gridSize.cols + colIndex)
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    gap: 10,
  },
  colorButton: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  colorButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  colorButtonDisabled: {
    opacity: 0.6,
  },
  colorButtonError: {
    borderColor: '#FF6B6B',
    borderWidth: 4,
  },
  colorButtonText: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});