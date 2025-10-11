import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
} from '@expo-google-fonts/orbitron';
import { useAuth } from '../store/useAuthStore';

interface GameCardProps {
  title: string;
  emoji: string;
  description: string;
  onPress: () => void;
  isComingSoon?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({
  title,
  emoji,
  description,
  onPress,
  isComingSoon = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isComingSoon}
    >
      <LinearGradient
        colors={['#8E2DE2', '#4A00E0', '#00FFC6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradientBorder}
      >
        <View style={[styles.cardContent, isComingSoon && styles.cardDisabled]}>
          <Text style={styles.cardEmoji}>{emoji}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
          {isComingSoon && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>COMING SOON</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
  });

  const handleGamePress = (gameType: string) => {
    navigation.navigate('GameScreen', { gameType });
  };

  const handleLeaderboardPress = () => {
    navigation.navigate('LeaderboardScreen');
  };

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
      
      {/* Floating Leaderboard Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleLeaderboardPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FF006E', '#8E2DE2']}
          style={styles.floatingButtonGradient}
        >
          <Ionicons name="trophy" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>COLOR RUSH</Text>
          <Text style={styles.subtitle}>ARENA</Text>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={20} color="#8E2DE2" />
            <Text style={styles.userText}>
              Player: {user?.uid?.slice(-6) || 'Guest'}
            </Text>
          </View>
        </View>

        {/* Game Cards */}
        <View style={styles.gamesContainer}>
          <Text style={styles.sectionTitle}>Choose Your Challenge</Text>
          
          <GameCard
            title="Color Match"
            emoji="🎨"
            description="Test your focus with the Stroop effect"
            onPress={() => handleGamePress('colorMatch')}
          />

          <GameCard
            title="Reaction Tap"
            emoji="⚡"
            description="Lightning-fast reaction testing"
            onPress={() => handleGamePress('reactionTap')}
          />

          <GameCard
            title="Color Snake"
            emoji="🐍"
            description="Navigate the neon maze"
            onPress={() => handleGamePress('colorSnake')}
            isComingSoon={true}
          />
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  floatingButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#FF006E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 36,
    fontFamily: 'Orbitron_900Black',
    color: '#FFFFFF',
    textShadowColor: '#8E2DE2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    textShadowColor: '#00FFC6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginTop: -5,
    letterSpacing: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(142, 45, 226, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  userText: {
    color: '#B8B8D1',
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#4A00E0',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  gamesContainer: {
    marginBottom: 40,
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 20,
  },
  cardGradientBorder: {
    padding: 2,
    borderRadius: 20,
  },
  cardContent: {
    backgroundColor: '#0F0F1B',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: '#8E2DE2',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    lineHeight: 20,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
  },
  comingSoonText: {
    fontSize: 12,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFB800',
    letterSpacing: 1,
  },
  statsContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.2)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    textShadowColor: '#00FFC6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});