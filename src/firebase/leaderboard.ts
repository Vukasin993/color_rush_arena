import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { firestore } from './config';

export interface LeaderboardEntry {
  uid: string;
  username: string;
  avatar?: string;
  totalXP: number;
  level: number;
  totalGames: number;
  colorMatchStats: {
    totalGames: number;
    bestScore: number;
    averageScore: number;
    totalXP: number;
    easyCompleted: number;
    mediumCompleted: number;
    hardCompleted: number;
  };
  reactionTapStats: {
    totalGames: number;
    bestScore: number;
    averageScore: number;
    totalXP: number;
    easyCompleted: number;
    mediumCompleted: number;
    hardCompleted: number;
  };
}

export interface LeaderboardStats {
  rank: number;
  totalPlayers: number;
  percentile: number;
}

class LeaderboardService {
  private readonly USERS_COLLECTION = 'users';

  // No more submitScore - stats are updated in userService directly
  async submitScore(entry: any): Promise<string> {
    console.log('✅ Score submission handled by userService, no leaderboard entry needed');
    return 'handled-by-user-service';
  }

  // Get top players by total XP
  async getTopPlayersByXP(limitCount: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(firestore, this.USERS_COLLECTION),
        orderBy('totalXP', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const players: LeaderboardEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        players.push({
          uid: doc.id,
          username: data.username,
          avatar: data.avatar,
          totalXP: data.totalXP || 0,
          level: data.level || 1,
          totalGames: data.totalGames || 0,
          colorMatchStats: data.colorMatchStats || {
            totalGames: 0,
            bestScore: 0,
            averageScore: 0,
            totalXP: 0,
            easyCompleted: 0,
            mediumCompleted: 0,
            hardCompleted: 0,
          },
          reactionTapStats: data.reactionTapStats || {
            totalGames: 0,
            bestScore: 0,
            averageScore: 0,
            totalXP: 0,
            easyCompleted: 0,
            mediumCompleted: 0,
            hardCompleted: 0,
          },
        });
      });

      console.log(`📊 Retrieved ${players.length} top players by XP`);
      return players;
    } catch (error) {
      console.error('❌ Error getting top players:', error);
      return [];
    }
  }

  // Get top players by best score for specific game
  async getTopPlayersByGameScore(
    gameType: 'colorMatch' | 'reactionTap',
    limitCount: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      const statsField = `${gameType}Stats.bestScore`;
      
      const q = query(
        collection(firestore, this.USERS_COLLECTION),
        orderBy(statsField, 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const players: LeaderboardEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const gameStats = data[`${gameType}Stats`];
        
        // Only include players who have played this game
        if (gameStats && gameStats.totalGames > 0) {
          players.push({
            uid: doc.id,
            username: data.username,
            avatar: data.avatar,
            totalXP: data.totalXP || 0,
            level: data.level || 1,
            totalGames: data.totalGames || 0,
            colorMatchStats: data.colorMatchStats || {
              totalGames: 0,
              bestScore: 0,
              averageScore: 0,
              totalXP: 0,
              easyCompleted: 0,
              mediumCompleted: 0,
              hardCompleted: 0,
            },
            reactionTapStats: data.reactionTapStats || {
              totalGames: 0,
              bestScore: 0,
              averageScore: 0,
              totalXP: 0,
              easyCompleted: 0,
              mediumCompleted: 0,
              hardCompleted: 0,
            },
          });
        }
      });

      console.log(`📊 Retrieved ${players.length} top players for ${gameType}`);
      return players;
    } catch (error) {
      console.error('❌ Error getting top players by game score:', error);
      return [];
    }
  }

  // Get player's rank by total XP
  async getPlayerRankByXP(playerXP: number): Promise<LeaderboardStats> {
    try {
      // Get all players with higher XP
      const q = query(
        collection(firestore, this.USERS_COLLECTION),
        orderBy('totalXP', 'desc')
      );

      const querySnapshot = await getDocs(q);
      let rank = 0;
      let totalPlayers = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const userXP = data.totalXP || 0;
        totalPlayers++;
        
        if (userXP > playerXP) {
          rank++;
        }
      });

      rank = rank + 1; // Player's actual rank
      const percentile = totalPlayers > 0 ? Math.round(((totalPlayers - rank + 1) / totalPlayers) * 100) : 0;

      return {
        rank,
        totalPlayers,
        percentile
      };
    } catch (error) {
      console.error('❌ Error getting player rank:', error);
      return { rank: 0, totalPlayers: 0, percentile: 0 };
    }
  }

  // Legacy methods for compatibility
  async getTopScores(): Promise<LeaderboardEntry[]> {
    return this.getTopPlayersByXP();
  }

  async getPlayerRank(): Promise<LeaderboardStats> {
    return { rank: 0, totalPlayers: 0, percentile: 0 };
  }

  async getPlayerBestScores(): Promise<LeaderboardEntry[]> {
    return [];
  }

  async getGlobalLeaderboard(limitCount: number = 50): Promise<LeaderboardEntry[]> {
    return this.getTopPlayersByXP(limitCount);
  }
}

export const leaderboardService = new LeaderboardService();