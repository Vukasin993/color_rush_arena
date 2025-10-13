import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
} from '@expo-google-fonts/orbitron';

interface GameOverModalProps {
  visible: boolean;
  score: number;
  round: number;
  isWin: boolean;
  onRestart: () => void;
  onExit: () => void;
  levelName: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  score,
  round,
  isWin,
  onRestart,
  onExit,
  levelName,
}) => {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['rgba(26, 26, 46, 0.95)', 'rgba(15, 15, 27, 0.95)']}
            style={styles.modalContent}
          >
            {/* Result Icon */}
            <View style={styles.iconContainer}>
              {isWin ? (
                <Ionicons name="trophy" size={60} color="#FFD60A" />
              ) : (
                <Ionicons name="close-circle" size={60} color="#FF6B6B" />
              )}
            </View>

            {/* Title */}
            <Text style={[
              styles.title,
              { color: isWin ? '#FFD60A' : '#FF6B6B' }
            ]}>
              {isWin ? 'VICTORY!' : 'GAME OVER'}
            </Text>

            {/* Result Message */}
            <Text style={styles.message}>
              {isWin 
                ? `🎉 Amazing! You completed all sequences on ${levelName} level!`
                : `💭 You remembered ${round - 1} sequences correctly!`
              }
            </Text>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Final Score</Text>
                <Text style={styles.statValue}>{score}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Sequences</Text>
                <Text style={styles.statValue}>{round - 1}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Level</Text>
                <Text style={styles.statValue}>{levelName}</Text>
              </View>
            </View>

            {/* XP Earned */}
            <View style={styles.xpContainer}>
              <Ionicons name="star" size={20} color="#FFD60A" />
              <Text style={styles.xpText}>
                +{score * 10 + (score > 50 ? 200 : score > 20 ? 100 : 0)} XP Earned!
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={onRestart}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#00FFC6', '#00D4AA']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>PLAY AGAIN</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.button}
                onPress={onExit}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8E2DE2', '#4A00E0']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="home" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>EXIT</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    margin: 20,
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#8E2DE2',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  modalContent: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.5)',
    minWidth: 300,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Orbitron_900Black',
    textAlign: 'center',
    marginBottom: 15,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 2,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#8E2DE2',
    textAlign: 'center',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#00FFC6',
    textShadowRadius: 8,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  xpText: {
    fontSize: 14,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFD60A',
    marginLeft: 8,
    textShadowColor: '#FFD60A',
    textShadowRadius: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});