import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import { GameColor } from '../MemoryRushGame';

interface SequenceDisplayProps {
  sequence: string[];
  gameColors: GameColor[];
  showingSequence: boolean;
  currentSequenceIndex: number;
}

export const SequenceDisplay: React.FC<SequenceDisplayProps> = ({
  sequence,
  gameColors,
  showingSequence,
  currentSequenceIndex,
}) => {
  const scaleAnimations = useRef(
    sequence.map(() => new Animated.Value(1))
  ).current;

  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
  });

  // Update animations when sequence changes
  useEffect(() => {
    // Reset all animations
    scaleAnimations.forEach(anim => anim.setValue(1));
    
    // Add new animations if sequence grew
    while (scaleAnimations.length < sequence.length) {
      scaleAnimations.push(new Animated.Value(1));
    }
  }, [sequence, scaleAnimations]);

  // Animate current color
  useEffect(() => {
    if (showingSequence && currentSequenceIndex >= 0 && currentSequenceIndex < scaleAnimations.length) {
      const currentAnimation = scaleAnimations[currentSequenceIndex];
      
      // Pulse animation
      Animated.sequence([
        Animated.timing(currentAnimation, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(currentAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showingSequence, currentSequenceIndex, scaleAnimations]);

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  const getColorById = (colorId: string): GameColor | undefined => {
    return gameColors.find(color => color.id === colorId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sequence to Remember</Text>
      <View style={styles.sequenceContainer}>
        {sequence.map((colorId, index) => {
          const color = getColorById(colorId);
          if (!color) return null;

          const isActive = showingSequence && currentSequenceIndex === index;

          return (
            <Animated.View
              key={`${colorId}-${index}`}
              style={[
                styles.sequenceItem,
                {
                  transform: [{ scale: scaleAnimations[index] || new Animated.Value(1) }],
                },
              ]}
            >
              <LinearGradient
                colors={[color.color, color.color]}
                style={[
                  styles.sequenceItemGradient,
                  isActive && styles.sequenceItemActive,
                ]}
              >
                <Text style={styles.sequenceItemText}>
                  {color.name.charAt(0)}
                </Text>
              </LinearGradient>
            </Animated.View>
          );
        })}
        
        {sequence.length === 0 && (
          <Text style={styles.emptyText}>Preparing sequence...</Text>
        )}
      </View>
      
      <Text style={styles.sequenceInfo}>
        Length: {sequence.length} {sequence.length === 1 ? 'color' : 'colors'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: '#00FFC6',
    textShadowRadius: 8,
  },
  sequenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: 60,
    marginBottom: 10,
  },
  sequenceItem: {
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  sequenceItemGradient: {
    width: 40,
    height: 40,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sequenceItemActive: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    elevation: 12,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  sequenceItemText: {
    fontSize: 14,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Orbitron_700Bold',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  sequenceInfo: {
    fontSize: 12,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFD60A',
    textAlign: 'center',
    textShadowColor: '#FFD60A',
    textShadowRadius: 5,
  },
});