import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';

interface PauseModalProps {
  visible: boolean;
  onResume: () => void;
  onExit: () => void;
  onWatchAd: () => void;
}

const { width } = Dimensions.get('window');

export const PauseModal: React.FC<PauseModalProps> = ({
  visible,
  onResume,
  onExit,
  onWatchAd,
}) => {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => {}} // Prevent back button closing
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(26, 26, 46, 0.95)', 'rgba(15, 15, 27, 0.95)']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="pause" size={48} color="#FFD60A" />
              </View>
              <Text style={styles.title}>Game Paused</Text>
              <Text style={styles.subtitle}>Watch an ad to continue playing</Text>
            </View>

            {/* Ad Info */}
            <View style={styles.adInfoContainer}>
              <LinearGradient
                colors={['rgba(255, 214, 10, 0.1)', 'rgba(255, 149, 0, 0.1)']}
                style={styles.adInfoGradient}
              >
                <Ionicons name="play" size={24} color="#FFD60A" />
                <Text style={styles.adInfoText}>
                  Watch a short ad to resume your game and keep your progress!
                </Text>
              </LinearGradient>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {/* Watch Ad Button */}
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={onWatchAd}
              >
                <LinearGradient
                  colors={['#FFD60A', '#FF9500']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="play" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Watch Ad & Resume</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Exit Game Button */}
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={onExit}
              >
                <LinearGradient
                  colors={['#6B7280', '#4B5563']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="exit" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Exit Game</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: Math.min(width - 40, 380),
    borderRadius: 20,
    elevation: 20,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalGradient: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
    padding: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#FFD60A',
    textShadowRadius: 10,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  adInfoContainer: {
    marginBottom: 30,
  },
  adInfoGradient: {
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.2)',
  },
  adInfoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  buttonsContainer: {
    gap: 15,
  },
  button: {
    borderRadius: 12,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 2,
  },
});