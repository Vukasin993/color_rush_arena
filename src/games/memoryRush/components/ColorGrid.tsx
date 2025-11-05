import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import { GameColor } from '../MemoryRushGame';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    
    // Adjust size based on screen dimensions and grid size
    // For smaller screens or larger grids, use smaller buttons
    const isSmallScreen = SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
    const isLargeGrid = gridSize.cols >= 3 || gridSize.rows >= 3;
    
    let buttonSizePercent = 90 / gridSize.cols;
    let maxButtonSize = 120;
    
    if (isSmallScreen) {
      buttonSizePercent = 85 / gridSize.cols; // Smaller on small screens
      maxButtonSize = isLargeGrid ? 90 : 100;
    } else if (isLargeGrid) {
      maxButtonSize = 100;
    }
    
    const calculatedWidth = (SCREEN_WIDTH - 60) * (buttonSizePercent / 100);
    const buttonSize = Math.min(calculatedWidth, maxButtonSize);
    
    return (
      <TouchableOpacity
        key={color.id}
        style={[
          styles.colorButton,
          {
            width: buttonSize,
            height: buttonSize,
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

  // Adjust gaps for smaller screens
  const isSmallScreen = SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
  const rowGap = isSmallScreen ? 6 : 10;
  const colGap = isSmallScreen ? 6 : 10;

  return (
    <View style={styles.container}>
      {colorGrid.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { marginVertical: rowGap / 2, gap: colGap }]}>
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
    paddingHorizontal: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButton: {
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  colorButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
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