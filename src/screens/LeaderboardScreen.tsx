import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type LeaderboardScreenProps = NativeStackScreenProps<RootStackParamList, 'LeaderboardScreen'>;

interface ScoreEntry {
  id: string;
  game: string;
  score: number;
  date: string;
  emoji: string;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { colorMatchStats, reactionTapStats, totalXP, totalGames, bestScore } = useGame();
  
  // Combine and sort all game history
  const allScores: ScoreEntry[] = [
    ...colorMatchStats.gameHistory.map(game => ({
      id: game.id,
      game: 'Color Match',
      score: game.score,
      date: game.date.split('T')[0],
      emoji: '🎨',
    })),
    ...reactionTapStats.gameHistory.map(game => ({
      id: game.id,
      game: 'Reaction Tap', 
      score: game.score,
      date: game.date.split('T')[0],
      emoji: '⚡',
    })),
  ].sort((a, b) => b.score - a.score);

  // Add some mock data if no games played yet
  const mockScores: ScoreEntry[] = allScores.length === 0 ? [
    { id: '1', game: 'Color Match', score: 0, date: '2024-01-15', emoji: '🎨' },
    { id: '2', game: 'Reaction Tap', score: 0, date: '2024-01-14', emoji: '⚡' },
  ] : [];
  
  const displayScores = allScores.length > 0 ? allScores : mockScores;
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  const getRankColor = (index: number): [string, string] => {
    switch (index) {
      case 0:
        return ['#FFD700', '#FFB800']; // Gold
      case 1:
        return ['#C0C0C0', '#A8A8A8']; // Silver
      case 2:
        return ['#CD7F32', '#B8860B']; // Bronze
      default:
        return ['#8E2DE2', '#4A00E0']; // Purple
    }
  };

  const getRankEmoji = (index: number): string => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return '🏆';
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1A1A2E', '#16213E']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>🏆</Text>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Text style={styles.headerSubtitle}>Top Arena Champions</Text>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
        <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(0, 255, 198, 0.2)', 'rgba(0, 212, 170, 0.1)']}
            style={styles.statCardGradient}
          >
            <Text style={styles.statNumber}>{totalGames}</Text>
            <Text style={styles.statLabel}>Total Games</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(255, 184, 0, 0.2)', 'rgba(255, 159, 10, 0.1)']}
            style={styles.statCardGradient}
          >
            <Text style={styles.statNumber}>{bestScore}</Text>
            <Text style={styles.statLabel}>Best Score</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(142, 45, 226, 0.2)', 'rgba(74, 0, 224, 0.1)']}
            style={styles.statCardGradient}
          >
            <Text style={styles.statNumber}>{totalXP}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </LinearGradient>
        </View>
      </View>      {/* Leaderboard List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>All Time Best</Text>
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displayScores.map((score, index) => (
            <View key={score.id} style={styles.scoreItem}>
              <LinearGradient
                colors={[
                  `rgba(${index < 3 ? '255, 215, 0' : '142, 45, 226'}, 0.1)`,
                  `rgba(${index < 3 ? '255, 184, 0' : '74, 0, 224'}, 0.05)`
                ]}
                style={styles.scoreItemGradient}
              >
                {/* Rank */}
                <View style={styles.rankContainer}>
                  <LinearGradient
                    colors={getRankColor(index)}
                    style={styles.rankBadge}
                  >
                    <Text style={styles.rankEmoji}>{getRankEmoji(index)}</Text>
                  </LinearGradient>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>

                {/* Game Info */}
                <View style={styles.gameInfo}>
                  <View style={styles.gameHeader}>
                    <Text style={styles.gameEmoji}>{score.emoji}</Text>
                    <Text style={styles.gameName}>{score.game}</Text>
                  </View>
                  <Text style={styles.gameDate}>{score.date}</Text>
                </View>

                {/* Score */}
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreValue}>{score.score.toLocaleString()}</Text>
                  <Text style={styles.scoreLabel}>pts</Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Reset Button */}
      <TouchableOpacity
        style={styles.resetButton}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255, 59, 48, 0.2)', 'rgba(255, 45, 85, 0.1)']}
          style={styles.resetButtonGradient}
        >
          <Ionicons name="refresh" size={20} color="#FF3B30" />
          <Text style={styles.resetButtonText}>Clear All Scores</Text>
        </LinearGradient>
      </TouchableOpacity>
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
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 45, 226, 0.3)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 45, 226, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: '#8E2DE2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    marginBottom: 15,
    textShadowColor: '#00FFC6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  scoreItem: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
  },
  scoreItemGradient: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  rankEmoji: {
    fontSize: 16,
  },
  rankNumber: {
    fontSize: 12,
    fontFamily: 'Orbitron_700Bold',
    color: '#B8B8D1',
  },
  gameInfo: {
    flex: 1,
    marginRight: 15,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  gameEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  gameName: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
  },
  gameDate: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#6B7280',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    textShadowColor: '#00FFC6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
  },
  resetButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: 15,
    gap: 10,
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#FF3B30',
  },
});