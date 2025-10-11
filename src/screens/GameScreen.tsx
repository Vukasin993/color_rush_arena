import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';

interface GameScreenProps {
  navigation: any;
  route: {
    params?: {
      gameType?: string;
    };
  };
}

export const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const gameType = route.params?.gameType || 'unknown';

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  const getGameInfo = () => {
    switch (gameType) {
      case 'colorMatch':
        return {
          title: 'Color Match',
          emoji: '🎨',
          description: 'Test your focus with the Stroop effect',
          instructions: 'Tap the color that matches the WORD, not the text color!',
        };
      case 'reactionTap':
        return {
          title: 'Reaction Tap',
          emoji: '⚡',
          description: 'Lightning-fast reaction testing',
          instructions: 'Tap as soon as the circle turns green!',
        };
      case 'colorSnake':
        return {
          title: 'Color Snake',
          emoji: '🐍',
          description: 'Navigate the neon maze',
          instructions: 'Coming soon...',
        };
      default:
        return {
          title: 'Unknown Game',
          emoji: '❓',
          description: 'Game not found',
          instructions: 'This game is not available yet.',
        };
    }
  };

  const gameInfo = getGameInfo();

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#8E2DE2', '#4A00E0']}
          style={styles.backButtonGradient}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Game Header */}
        <View style={styles.header}>
          <Text style={styles.gameEmoji}>{gameInfo.emoji}</Text>
          <Text style={styles.gameTitle}>{gameInfo.title}</Text>
          <Text style={styles.gameDescription}>{gameInfo.description}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Play:</Text>
          <Text style={styles.instructionsText}>{gameInfo.instructions}</Text>
        </View>

        {/* Game Area */}
        <View style={styles.gameArea}>
          <Text style={styles.comingSoonText}>
            {gameType === 'colorSnake' ? '🚧 Coming Soon 🚧' : '🎮 Game Implementation 🎮'}
          </Text>
          <Text style={styles.gameAreaSubtext}>
            Game components will be implemented here
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            disabled={gameType === 'colorSnake'}
          >
            <LinearGradient
              colors={gameType === 'colorSnake' ? ['#6B7280', '#4B5563'] : ['#00FFC6', '#00D4AA']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>
                {gameType === 'colorSnake' ? 'Coming Soon' : 'Start Game'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>High Scores</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E2DE2',
    fontSize: 18,
    fontFamily: 'Orbitron_400Regular',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#8E2DE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  backButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  gameEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  gameTitle: {
    fontSize: 32,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#8E2DE2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  gameDescription: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  instructionsTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    marginBottom: 10,
    textShadowColor: '#00FFC6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 0, 224, 0.1)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(142, 45, 226, 0.3)',
    borderStyle: 'dashed',
    padding: 40,
    marginBottom: 30,
  },
  comingSoonText: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFB800',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#FFB800',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  gameAreaSubtext: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 15,
  },
  actionButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#00FFC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  actionButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: 'rgba(142, 45, 226, 0.2)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(142, 45, 226, 0.4)',
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#8E2DE2',
  },
});