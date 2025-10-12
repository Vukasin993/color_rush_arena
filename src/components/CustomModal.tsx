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

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons: {
    text: string;
    onPress: () => void;
    style?: 'primary' | 'secondary' | 'destructive';
    gradient?: [string, string];
  }[];
}

const { width } = Dimensions.get('window');

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  message,
  icon,
  iconColor = '#8E2DE2',
  buttons,
}) => {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  if (!fontsLoaded) return null;

  const getButtonStyle = (style?: string): [string, string] => {
    switch (style) {
      case 'primary':
        return ['#8E2DE2', '#4A00E0'];
      case 'destructive':
        return ['#8B0000', '#DC143C'];
      case 'secondary':
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(26, 26, 46, 0.95)', 'rgba(15, 15, 27, 0.95)']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              {icon && (
                <View style={styles.iconContainer}>
                  <Ionicons name={icon} size={48} color={iconColor} />
                </View>
              )}
              <Text style={styles.title}>{title}</Text>
            </View>

            {/* Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{message}</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.button}
                  activeOpacity={0.8}
                  onPress={button.onPress}
                >
                  <LinearGradient
                    colors={button.gradient || getButtonStyle(button.style)}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>{button.text}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
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
    padding: 10,
  },
  modalContainer: {
    width: Math.min(width - 10, 380),
    borderRadius: 20,
    elevation: 20,
    shadowColor: '#8E2DE2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalGradient: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
    padding: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 50,
    backgroundColor: 'rgba(142, 45, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#8E2DE2',
    textShadowRadius: 10,
  },
  messageContainer: {
    marginBottom: 30,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    gap: 12,
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
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 2,
  },
});