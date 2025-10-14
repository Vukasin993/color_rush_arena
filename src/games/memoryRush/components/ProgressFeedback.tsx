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

interface FeedbackSquare {
  status: 'pending' | 'correct' | 'incorrect';
  colorId?: string;
}

interface ProgressFeedbackProps {
  sequence: string[];
  userProgress: FeedbackSquare[];
  currentInputIndex: number;
}

export const ProgressFeedback: React.FC<ProgressFeedbackProps> = ({
  sequence,
  userProgress,
  currentInputIndex,
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

  // Animate when user makes a selection
  useEffect(() => {
    if (currentInputIndex > 0 && currentInputIndex <= scaleAnimations.length) {
      const animIndex = currentInputIndex - 1;
      const currentAnimation = scaleAnimations[animIndex];
      
      // Bounce animation for feedback
      Animated.sequence([
        Animated.timing(currentAnimation, {
          toValue: 1.4,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(currentAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentInputIndex, scaleAnimations]);

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  const getFeedbackIcon = (status: 'pending' | 'correct' | 'incorrect') => {
    switch (status) {
      case 'correct':
        return '✓';
      case 'incorrect':
        return '✗';
      default:
        return '?';
    }
  };

  const getFeedbackColors = (status: 'pending' | 'correct' | 'incorrect'): [string, string] => {
    switch (status) {
      case 'correct':
        return ['#4CAF50', '#66BB6A'];
      case 'incorrect':
        return ['#F44336', '#EF5350'];
      default:
        return ['#37474F', '#546E7A'];
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
      <View style={styles.progressContainer}>
        {sequence.map((_, index) => {
          const feedback = userProgress[index] || { status: 'pending' };
          const isActive = currentInputIndex === index;

          return (
            <Animated.View
              key={index}
              style={[
                styles.feedbackSquare,
                {
                  transform: [{ scale: scaleAnimations[index] || new Animated.Value(1) }],
                },
                isActive && styles.activeSquare,
              ]}
            >
              <LinearGradient
                colors={getFeedbackColors(feedback.status)}
                style={styles.feedbackGradient}
              >
                <Text style={[
                  styles.feedbackIcon,
                  feedback.status === 'pending' && styles.pendingIcon,
                ]}>
                  {getFeedbackIcon(feedback.status)}
                </Text>
              </LinearGradient>
            </Animated.View>
          );
        })}
        
        {sequence.length === 0 && (
          <Text style={styles.emptyText}>Waiting for sequence...</Text>
        )}
      </View>
      
      <Text style={styles.progressInfo}>
        {currentInputIndex} / {sequence.length} completed
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFD60A',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: '#FFD60A',
    textShadowRadius: 5,
  },
  progressContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    minHeight: 50,
    marginBottom: 8,
  },
  feedbackSquare: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  feedbackGradient: {
    width: 35,
    height: 35,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeSquare: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 14,
  },
  correctSquare: {
    elevation: 6,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  incorrectSquare: {
    elevation: 6,
    shadowColor: '#F44336',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  pendingSquare: {
    elevation: 3,
  },
  feedbackIcon: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pendingIcon: {
    color: '#B8B8D1',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Orbitron_700Bold',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  progressInfo: {
    fontSize: 11,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    textAlign: 'center',
    textShadowColor: '#00FFC6',
    textShadowRadius: 3,
  },
});