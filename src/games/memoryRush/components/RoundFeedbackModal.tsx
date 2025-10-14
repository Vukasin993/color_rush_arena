import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Orbitron_700Bold,
  Orbitron_400Regular,
} from '@expo-google-fonts/orbitron';

interface RoundFeedbackModalProps {
  visible: boolean;
  roundNumber: number;
  totalRounds: number;
  roundScore: number;
  isRoundComplete: boolean;
  onContinue: () => void;
}

export const RoundFeedbackModal: React.FC<RoundFeedbackModalProps> = ({
  visible,
  roundNumber,
  totalRounds,
  roundScore,
  isRoundComplete,
  onContinue,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Orbitron_400Regular,
  });

  useEffect(() => {
    if (visible) {
      // Animate modal appearance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when modal closes
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim]);

  if (!fontsLoaded || !visible) {
    return null;
  }

  const isLastRound = roundNumber >= totalRounds;
  const title = isLastRound ? "Game Complete!" : `Round ${roundNumber} Complete!`;
  const subtitle = isLastRound 
    ? "Congratulations! You've completed all rounds!"
    : `Get ready for Round ${roundNumber + 1}`;

  const getScoreMessage = (score: number) => {
    if (score === 100) return "Perfect! 🌟";
    if (score >= 80) return "Excellent! 🎉";
    if (score >= 60) return "Good job! 👍";
    if (score >= 40) return "Not bad! 💪";
    return "Keep trying! 💫";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      />
      
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['#1A1A2E', '#16213E', '#0F3460']}
            style={styles.modalGradient}
          >
            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            
            {/* Round info */}
            <View style={styles.roundInfo}>
              <Text style={styles.roundText}>
                Round Progress: {roundNumber}/{totalRounds}
              </Text>
            </View>

            {/* Score display */}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Round Score</Text>
              <LinearGradient
                colors={['#FFD60A', '#FF8500']}
                style={styles.scoreBackground}
              >
                <Text style={styles.scoreValue}>{roundScore}</Text>
              </LinearGradient>
              <Text style={styles.scoreMessage}>
                {getScoreMessage(roundScore)}
              </Text>
            </View>

            {/* Progress dots */}
            <View style={styles.progressDots}>
              {Array.from({ length: totalRounds }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index < roundNumber 
                      ? styles.completedDot 
                      : index === roundNumber - 1 
                        ? styles.currentDot 
                        : styles.pendingDot
                  ]}
                />
              ))}
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle}>{subtitle}</Text>

            {/* Continue button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00FFC6', '#00D4AA']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLastRound ? "View Results" : "Continue"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalGradient: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 198, 0.3)',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: '#00FFC6',
    textShadowRadius: 10,
  },
  roundInfo: {
    marginBottom: 20,
  },
  roundText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  scoreLabel: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  scoreBackground: {
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
    elevation: 5,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontFamily: 'Orbitron_700Bold',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  scoreMessage: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFD60A',
    textAlign: 'center',
    textShadowColor: '#FFD60A',
    textShadowRadius: 5,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  completedDot: {
    backgroundColor: '#4CAF50',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  currentDot: {
    backgroundColor: '#FFD60A',
    elevation: 5,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  pendingDot: {
    backgroundColor: '#37474F',
    borderWidth: 1,
    borderColor: '#546E7A',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  continueButton: {
    width: '100%',
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#00FFC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#1A1A2E',
  },
});