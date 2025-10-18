import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import { useGame } from '../store/useGameStore';
import { CustomModal } from '../components/CustomModal';

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
  const { isLevelUnlocked } = useGame();

  const [showAdModal, setShowAdModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'easy' | 'medium' | 'hard'>('easy');

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  const handleAdReward = (level: 'easy' | 'medium' | 'hard') => {
    setSelectedLevel(level);
    setShowAdModal(true);
  };

  const handleWatchAd = () => {
    setShowAdModal(false);
    // Simulate ad completion and navigate with bonus time
    if (gameType === 'colorMatch') {
      navigation.navigate('ColorMatchGame', { level: selectedLevel, bonusTime: 5 });
    } else if (gameType === 'reactionTap') {
      navigation.navigate('ReactionGame', { level: selectedLevel, bonusTime: 5 });
    }
  };

  const getGameInfo = () => {
    switch (gameType) {
      case 'colorMatch':
        return {
          title: 'Color Match',
          emoji: '🎨',
          description: 'Test your focus with the Stroop effect',
          instructions: 'Tap the color that matches the WORD, not the text color!',
        };
      case 'memoryRush':
        return {
          title: 'Memory Rush',
          emoji: '🧩',
          description: 'Color sequence memory challenge',
          instructions: 'Watch the sequence, then repeat it by tapping colors in order!',
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

      <ScrollView style={styles.content}>
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

        {/* Level Selection */}
        {(gameType === 'colorMatch' || gameType === 'reactionTap') && (
          <View style={styles.levelSelectionContainer}>
            <Text style={styles.levelSelectionTitle}>Choose Difficulty:</Text>
            
            {/* Easy Level */}
            <TouchableOpacity
              style={styles.levelButton}
              activeOpacity={0.8}
              onPress={() => {
                if (gameType === 'colorMatch') {
                  navigation.navigate('ColorMatchGame', { level: 'easy' });
                } else if (gameType === 'reactionTap') {
                  navigation.navigate('ReactionGame', { level: 'easy' });
                }
              }}
            >
              <LinearGradient
                colors={['#00FFC6', '#00D4AA']}
                style={styles.levelButtonGradient}
              >
                <View style={styles.levelButtonContent}>
                  <Text style={styles.levelButtonTitle}>🟢 EASY</Text>
                  <Text style={styles.levelButtonSubtitle}>
                    {gameType === 'colorMatch' 
                      ? '4 Colors • 30s' 
                      : gameType === 'reactionTap'
                      ? 'Standard Speed • 5 Rounds'
                      : '4 Colors • 2-5 Sequence'
                    }
                  </Text>
                  <Text style={styles.levelButtonStatus}>✓ Unlocked</Text>
                  
                  {/* Ad Reward Option */}
                  <TouchableOpacity
                    style={styles.adRewardOption}
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleAdReward('easy');
                    }}
                  >
                    <Ionicons name="play" size={14} color="#FFD60A" />
                    <Text style={styles.adRewardOptionText}>Watch ad for +5s</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Medium Level */}
            <TouchableOpacity
              style={[
                styles.levelButton,
                !isLevelUnlocked(gameType as any, 'medium') && styles.levelButtonLocked
              ]}
              activeOpacity={0.8}
              disabled={!isLevelUnlocked(gameType as any, 'medium')}
              onPress={() => {
                if (gameType === 'colorMatch') {
                  navigation.navigate('ColorMatchGame', { level: 'medium' });
                } else if (gameType === 'reactionTap') {
                  navigation.navigate('ReactionGame', { level: 'medium' });
                }
              }}
            >
              <LinearGradient
                colors={isLevelUnlocked(gameType as any, 'medium') 
                  ? ['#FFD60A', '#FFB800'] 
                  : ['#6B7280', '#4B5563']
                }
                style={styles.levelButtonGradient}
              >
                <View style={styles.levelButtonContent}>
                  <Text style={styles.levelButtonTitle}>🟡 MEDIUM</Text>
                  <Text style={styles.levelButtonSubtitle}>
                    {gameType === 'colorMatch' 
                      ? '6 Colors • 45s' 
                      : gameType === 'reactionTap'
                      ? 'Faster Speed • 5 Rounds'
                      : '6 Colors • 3-7 Sequence'
                    }
                  </Text>
                  <Text style={styles.levelButtonStatus}>
                    {isLevelUnlocked(gameType as any, 'medium') 
                      ? '✓ Unlocked' 
                      : '🔒 Need 10,000 XP'
                    }
                  </Text>
                  
                  {/* Ad Reward Option */}
                  {isLevelUnlocked(gameType as any, 'medium') && (
                    <TouchableOpacity
                      style={styles.adRewardOption}
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAdReward('medium');
                      }}
                    >
                      <Ionicons name="play" size={14} color="#FFD60A" />
                      <Text style={styles.adRewardOptionText}>Watch ad for +5s</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Hard Level */}
            <TouchableOpacity
              style={[
                styles.levelButton,
                !isLevelUnlocked(gameType as any, 'hard') && styles.levelButtonLocked
              ]}
              activeOpacity={0.8}
              disabled={!isLevelUnlocked(gameType as any, 'hard')}
              onPress={() => {
                if (gameType === 'colorMatch') {
                  navigation.navigate('ColorMatchGame', { level: 'hard' });
                } else if (gameType === 'reactionTap') {
                  navigation.navigate('ReactionGame', { level: 'hard' });
                }
              }}
            >
              <LinearGradient
                colors={isLevelUnlocked(gameType as any, 'hard') 
                  ? ['#FF3B30', '#FF2D55'] 
                  : ['#6B7280', '#4B5563']
                }
                style={styles.levelButtonGradient}
              >
                <View style={styles.levelButtonContent}>
                  <Text style={styles.levelButtonTitle}>🔴 HARD</Text>
                  <Text style={styles.levelButtonSubtitle}>
                    {gameType === 'colorMatch' 
                      ? '8 Colors • 60s' 
                      : gameType === 'reactionTap'
                      ? 'Lightning Speed • 5 Rounds'
                      : '6 Colors • 4-9 Sequence'
                    }
                  </Text>
                  <Text style={styles.levelButtonStatus}>
                    {isLevelUnlocked(gameType as any, 'hard') 
                      ? '✓ Unlocked' 
                      : '🔒 Need 40,000 XP'
                    }
                  </Text>
                  
                  {/* Ad Reward Option */}
                  {isLevelUnlocked(gameType as any, 'hard') && (
                    <TouchableOpacity
                      style={styles.adRewardOption}
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAdReward('hard');
                      }}
                    >
                      <Ionicons name="play" size={14} color="#FFD60A" />
                      <Text style={styles.adRewardOptionText}>Watch ad for +5s</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        )}

        {/* Memory Rush - Direct Start */}
        {gameType === 'memoryRush' && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MemoryRushGame', { autoStart: true })}
            >
              <LinearGradient
                colors={['#00FFC6', '#00D4AA']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>🎮 START ENDLESS MODE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Coming Soon for Color Snake */}
        {gameType === 'colorSnake' && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.8}
              disabled={true}
            >
              <LinearGradient
                colors={['#6B7280', '#4B5563']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>Coming Soon</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Leaderboard Button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('LeaderboardScreen', { gameType: gameType as any })}
        >
          <Text style={styles.secondaryButtonText}>High Scores</Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomModal
        visible={showAdModal}
        onClose={() => setShowAdModal(false)}
        title="🎥 Watch Ad for +5 Seconds"
        message="Watch a short ad to get 5 extra seconds of game time! This will give you more time to achieve a higher score."
        icon="play"
        buttons={[
          {
            text: 'Cancel',
            style: 'secondary',
            onPress: () => setShowAdModal(false),
          },
          {
            text: 'Watch Ad',
            style: 'primary',
            onPress: handleWatchAd,
          },
        ]}
      />
    </SafeAreaView>
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
    paddingTop: 90,
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
    fontSize: 14,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  secondaryButton: {
    marginTop: 20,
    backgroundColor: 'rgba(127, 2, 237, 0.2)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#bf82f5ff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Orbitron_700Bold',
    color: '#bf82f5ff',
  },
  levelSelectionContainer: {
    marginBottom: 60,
  },
  levelSelectionTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#8E2DE2',
    textShadowRadius: 10,
  },
  levelButton: {
    borderRadius: 15,
    marginBottom: 15,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  levelButtonLocked: {
    opacity: 0.6,
  },
  levelButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  levelButtonContent: {
    alignItems: 'center',
    width: '100%',
  },
  levelButtonTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 4,
  },
  levelButtonSubtitle: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
    marginBottom: 8,
    opacity: 0.9,
  },
  levelButtonStatus: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 10,
  },
  adRewardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
    marginTop: 8,
  },
  adRewardOptionText: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFD60A',
    fontWeight: '600',
  },
});