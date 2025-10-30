import React, { useState, useEffect, useCallback } from 'react';
import Avatar1 from '@/assets/svg/1.svg';
import Avatar2 from '@/assets/svg/2.svg';
import Avatar3 from '@/assets/svg/3.svg';
import Avatar4 from '@/assets/svg/4.svg';
import Avatar5 from '@/assets/svg/5.svg';
import Avatar6 from '@/assets/svg/6.svg';
import Avatar7 from '@/assets/svg/7.svg';
import Avatar8 from '@/assets/svg/8.svg';
import Avatar9 from '@/assets/svg/9.svg';
import Avatar10 from '@/assets/svg/10.svg';
import Avatar11 from '@/assets/svg/11.svg';
import Avatar12 from '@/assets/svg/12.svg';
import Avatar13 from '@/assets/svg/13.svg';
import Avatar14 from '@/assets/svg/14.svg';
import Avatar15 from '@/assets/svg/15.svg';
import Avatar16 from '@/assets/svg/16.svg';
import Avatar17 from '@/assets/svg/17.svg';
import Avatar18 from '@/assets/svg/18.svg';
// eslint-disable-next-line import/no-unresolved
import Avatar19 from '@/assets/svg/19.svg';
import Avatar20 from '@/assets/svg/20.svg';
import Avatar21 from '@/assets/svg/21.svg';
import Avatar22 from '@/assets/svg/22.svg';
import Avatar23 from '@/assets/svg/23.svg';
import Avatar24 from '@/assets/svg/24.svg';
import Avatar25 from '@/assets/svg/25.svg';
import Avatar26 from '@/assets/svg/26.svg';
import Avatar27 from '@/assets/svg/27.svg';
import Avatar28 from '@/assets/svg/28.svg';
import Avatar29 from '@/assets/svg/29.svg';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
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
import { leaderboardService, LeaderboardEntry } from '../firebase/leaderboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';


const avatarKeys = [
  '1.svg', '2.svg', '3.svg', '4.svg', '5.svg', '6.svg', '7.svg', '8.svg', '9.svg',
  '10.svg', '11.svg', '12.svg', '13.svg', '14.svg', '15.svg', '16.svg', '17.svg', '18.svg',
  '19.svg', '20.svg', '21.svg', '22.svg', '23.svg', '24.svg', '25.svg', '26.svg', '27.svg', '28.svg', '29.svg'
] as const;

type AvatarKey = typeof avatarKeys[number];

const avatarMap: Record<AvatarKey, React.FC<React.SVGProps<SVGSVGElement>>> = {
  '1.svg': Avatar1,
  '2.svg': Avatar2,
  '3.svg': Avatar3,
  '4.svg': Avatar4,
  '5.svg': Avatar5,
  '6.svg': Avatar6,
  '7.svg': Avatar7,
  '8.svg': Avatar8,
  '9.svg': Avatar9,
  '10.svg': Avatar10,
  '11.svg': Avatar11,
  '12.svg': Avatar12,
  '13.svg': Avatar13,
  '14.svg': Avatar14,
  '15.svg': Avatar15,
  '16.svg': Avatar16,
  '17.svg': Avatar17,
  '18.svg': Avatar18,
  '19.svg': Avatar19,
  '20.svg': Avatar20,
  '21.svg': Avatar21,
  '22.svg': Avatar22,
  '23.svg': Avatar23,
  '24.svg': Avatar24,
  '25.svg': Avatar25,
  '26.svg': Avatar26,
  '27.svg': Avatar27,
  '28.svg': Avatar28,
  '29.svg': Avatar29
};

interface UserAvatarProps {
  avatar?: AvatarKey;
  size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ avatar = '1.svg', size = 32 }) => {
  const SvgIcon = avatarMap[avatar] || Avatar1;
  return <SvgIcon width={size} height={size} fill="#fff" />;
};

type LeaderboardScreenProps = NativeStackScreenProps<RootStackParamList, 'LeaderboardScreen'>;

interface ScoreEntry {
  id: string;
  game: string;
  score: number;
  date: string;
  emoji: string;
  level: string;
  userId: string;
  username?: string;
  highestLevel?: number;
  avatar?: string;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation, route }) => {
  const { gameType } = route.params || {};
  const { colorMatchStats, colorMatchEndlessStats, memoryRushStats } = useGame();
  const [firebaseScores, setFirebaseScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<'colorMatch' | 'memoryRush' | 'colorMatchEndless'>(
    gameType === 'memoryRush' ? 'memoryRush' : 'colorMatch'
  );
  const [selectedLevel, setSelectedLevel] = useState<'easy' | 'medium' | 'hard'>('easy');

  
  // Fetch scores from Firebase
  const fetchScores = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const scores = await leaderboardService.getTopPlayersByGameScore(selectedGame as 'colorMatch' | 'memoryRush' | 'colorMatchEndless', 100);
      setFirebaseScores(scores);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setFirebaseScores([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedGame]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const onRefresh = () => {
    fetchScores(true);
  };

  // Convert Firebase scores to display format - Best scores for selected level
  const getDisplayScores = (): ScoreEntry[] => {
    if (firebaseScores.length > 0) {
      if (selectedGame === 'colorMatch') {
        const gameStats = 'colorMatchStats';
        const levelProperty = `${selectedLevel}Completed` as keyof typeof firebaseScores[0]['colorMatchStats'];
        const bestScoreRanking = [...firebaseScores]
          .filter(player => {
            const stats = player[gameStats];
            return stats && stats.totalGames > 0 && stats[levelProperty] > 0 && stats.bestScore > 0;
          })
          .sort((a, b) => b[gameStats].bestScore - a[gameStats].bestScore)
          .slice(0, 100);
        return bestScoreRanking.map((player, index) => ({
          id: `best_${selectedLevel}_${player.uid}_${index}`,
          game: `Color Match - ${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Level`,
          score: player[gameStats].bestScore,
          date: new Date().toISOString().split('T')[0],
          emoji: '🎨',
          level: `${selectedLevel === 'easy' ? '🟢' : selectedLevel === 'medium' ? '🟡' : '🔴'} ${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)}`,
          userId: player.uid,
          username: player.username,
          avatar: player.avatar,
        }));
      } else if (selectedGame === 'colorMatchEndless') {
        const gameStats = 'colorMatchEndlessStats';
        const bestScoreRanking = [...firebaseScores]
          .filter(player => {
            const stats = player[gameStats];
            return stats && stats.totalGames > 0 && stats.bestScore > 0;
          })
          .sort((a, b) => b[gameStats].bestScore - a[gameStats].bestScore)
          .slice(0, 100);

        return bestScoreRanking.map((player, index) => ({
          id: `endless_${player.uid}_${index}`,
          game: 'Color Match - Endless Mode',
          score: player[gameStats].bestScore,
          date: new Date().toISOString().split('T')[0],
          emoji: '♾️',
          level: `${player[gameStats].questionsAnswered} questions answered`,
          userId: player.uid,
          username: player.username,
          avatar: player.avatar,
        }));
      } else {
        // Memory Rush: best score + highest level
        const gameStats = 'memoryRushStats';
        const bestScoreRanking = [...firebaseScores]
          .filter(player => {
            const stats = player[gameStats];
            return stats && stats.totalGames > 0 && stats.bestScore > 0;
          })
          .sort((a, b) => b[gameStats].bestScore - a[gameStats].bestScore)
          .slice(0, 100);
        return bestScoreRanking.map((player, index) => ({
          id: `best_memoryRush_${player.uid}_${index}`,
          game: 'Memory Rush',
          score: player[gameStats].bestScore,
          date: new Date().toISOString().split('T')[0],
          emoji: '🧠',
          level: '',
          userId: player.uid,
          username: player.username,
          highestLevel: player[gameStats].highestLevel || 1,
          avatar: player.avatar,
        }));
      }
    }
    // Fall back to local scores
    if (selectedGame === 'colorMatch') {
      const allScores: ScoreEntry[] = [
        ...colorMatchStats.gameHistory.map(game => ({
          id: game.id,
          game: 'Color Match',
          score: game.score,
          date: game.date.split('T')[0],
          emoji: '🎨',
          level: game.level,
          userId: 'local',
        })),
      ].sort((a, b) => b.score - a.score);
      return allScores.length > 0 ? allScores : [
        { id: '1', game: 'Color Match', score: 0, date: '2024-01-15', emoji: '🎨', level: 'easy', userId: 'demo' },
      ];
    } else if (selectedGame === 'colorMatchEndless') {
      // For now, return empty array since we don't have local endless stats
      return [
        { id: '1', game: 'Endless Mode', score: 0, date: '2024-01-15', emoji: '♾️', level: 'endless', userId: 'demo' },
      ];
    } else {
      const allScores: ScoreEntry[] = [
        ...memoryRushStats.gameHistory.map(game => ({
          id: game.id,
          game: 'Memory Rush',
          score: game.score,
          date: game.date.split('T')[0],
          emoji: '🧠',
          level: '',
          userId: 'local',
          highestLevel: memoryRushStats.highestLevel || 1,
        })),
      ].sort((a, b) => b.score - a.score);
      return allScores.length > 0 ? allScores : [
        { id: '1', game: 'Memory Rush', score: 0, date: '2024-01-15', emoji: '🧠', level: '', userId: 'demo', highestLevel: 1 },
      ];
    }
  };
  
  const displayScores = getDisplayScores();
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

      <View style={styles.filterContainer}>
        <View style={styles.filterTabs}>
          {[
            { key: 'colorMatch', label: 'Color Match', emoji: '🎨' },
            { key: 'colorMatchEndless', label: 'Endless Mode', emoji: '♾️' },
            { key: 'memoryRush', label: 'Memory Rush', emoji: '🧠' },
          ].map((game) => (
            <TouchableOpacity
              key={game.key}
              style={[
                styles.filterTab,
                selectedGame === game.key && styles.filterTabActive
              ]}
              onPress={() => setSelectedGame(game.key as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.filterTabEmoji}>{game.emoji}</Text>
              <Text style={[
                styles.filterTabText,
                selectedGame === game.key && styles.filterTabTextActive
              ]}>
                {game.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Cards - Compact */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(255, 184, 0, 0.2)', 'rgba(255, 159, 10, 0.1)']}
            style={styles.statCardGradient}
          >
            <Text style={styles.statNumber}>
              {selectedGame === 'colorMatch' ? colorMatchStats.bestScore : selectedGame === "colorMatchEndless" ? colorMatchEndlessStats.bestScore : memoryRushStats.bestScore}
            </Text>
            <Text style={styles.statLabel}>Best Score</Text>
          </LinearGradient>
        </View>
        {selectedGame === 'colorMatch' && (
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(0, 255, 198, 0.2)', 'rgba(0, 212, 170, 0.1)']}
              style={styles.statCardGradient}
            >
              <Text style={styles.statNumber}>
                {Math.round(colorMatchStats.averageScore)}
              </Text>
              <Text style={styles.statLabel}>Average</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>All Time Best</Text>
        <View style={{ flex: 1, minHeight: 0 }}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {loading && !refreshing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8E2DE2" />
                <Text style={styles.loadingText}>Loading leaderboard...</Text>
              </View>
            )}
            {!loading && displayScores.length > 0 ? (
              displayScores.map((score, index) => (
                <View key={score.id} style={styles.scoreItemImproved}>
                  <View style={styles.rankContainer}>
                    <LinearGradient
                      colors={getRankColor(index)}
                      style={styles.rankBadge}
                    >
                      <Text style={styles.rankEmoji}>{getRankEmoji(index)}</Text>
                    </LinearGradient>
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  </View>
                  <View style={styles.leaderboardMainInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {score.avatar && avatarKeys.includes(score.avatar as AvatarKey) ? (
                        <UserAvatar avatar={score.avatar as AvatarKey} size={22} />
                      ) : (
                        <UserAvatar avatar="1.svg" size={28} />
                      )}
                      <Text style={styles.leaderboardUsername}>{score.username || 'Player'}</Text>
                    </View>
                    <Text style={styles.leaderboardScore}>{score.score.toLocaleString()} pts</Text>
                    {selectedGame === 'memoryRush' && (
                      <Text style={styles.leaderboardScore}>
                        Level: {score.highestLevel || 1}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              !loading && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>No scores yet.</Text>
                </View>
              )
            )}
          </ScrollView>
        </View>
      </View>
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
    paddingTop: 15,
    paddingBottom: 15,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: -20
  },
  headerEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
    textShadowColor: '#8E2DE2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
  },
  statNumber: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 10,
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
    paddingBottom: 30,
  },
  scoreItemImproved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(26,26,46,0.8)',
    borderRadius: 15,
    marginBottom: 10,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.15)',
    minHeight: 64,
  },
  leaderboardMainInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 16,
  },
  leaderboardUsername: {
    fontSize: 14,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  leaderboardScore: {
    fontSize: 15,
    fontFamily: 'Orbitron_400Regular',
    color: '#00FFC6',
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
    fontSize: 12,
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

  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  filterTab: {
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
    minWidth: 80,
  },
  filterTabActive: {
    backgroundColor: 'rgba(142, 45, 226, 0.3)',
    borderColor: '#8E2DE2',
  },
  filterTabEmoji: {
    fontSize: 16,
    marginBottom: 3,
  },
  filterTabText: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Orbitron_700Bold',
  },
  levelContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  levelTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  levelTab: {
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
    minWidth: 60,
  },
  levelTabActive: {
    backgroundColor: 'rgba(142, 45, 226, 0.3)',
    borderColor: '#8E2DE2',
  },
  levelTabEmoji: {
    fontSize: 12,
    marginBottom: 2,
  },
  levelTabText: {
    fontSize: 10,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  levelTabTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Orbitron_700Bold',
  },

});