import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { firestore } from './config';

export interface LeaderboardEntry {
  id?: string;
  userId: string;
  gameType: 'colorMatch' | 'reactionTap' | 'colorSnake';
  level: 'easy' | 'medium' | 'hard';
  score: number;
  xpEarned: number;
  reactionTime?: number; // For reaction tap game
  accuracy?: number; // For color match game
  timestamp: Date;
  createdAt: Timestamp;
}

export interface LeaderboardStats {
  rank: number;
  totalPlayers: number;
  percentile: number;
}

class LeaderboardService {
  private readonly COLLECTION_NAME = 'leaderboard';

  // Submit score to leaderboard
  async submitScore(entry: Omit<LeaderboardEntry, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, this.COLLECTION_NAME), {
        ...entry,
        createdAt: Timestamp.now(),
      });
      
      console.log('📊 Score submitted to leaderboard:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error submitting score:', error);
      throw error;
    }
  }

  // Get top scores for a specific game and level
  async getTopScores(
    gameType: 'colorMatch' | 'reactionTap' | 'colorSnake',
    level: 'easy' | 'medium' | 'hard' = 'easy',
    limitCount: number = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION_NAME),
        where('gameType', '==', gameType),
        where('level', '==', level),
        orderBy('score', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const scores: LeaderboardEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scores.push({
          id: doc.id,
          ...data,
          timestamp: data.createdAt.toDate(),
        } as LeaderboardEntry);
      });

      console.log(`📊 Retrieved ${scores.length} scores for ${gameType} (${level})`);
      return scores;
    } catch (error) {
      console.error('❌ Error getting top scores:', error);
      return [];
    }
  }

  // Get player's rank for a specific score
  async getPlayerRank(
    gameType: 'colorMatch' | 'reactionTap' | 'colorSnake',
    level: 'easy' | 'medium' | 'hard',
    score: number
  ): Promise<LeaderboardStats> {
    try {
      // Get all scores higher than player's score
      const higherScoresQuery = query(
        collection(firestore, this.COLLECTION_NAME),
        where('gameType', '==', gameType),
        where('level', '==', level),
        where('score', '>', score)
      );

      // Get total scores for this game/level
      const totalScoresQuery = query(
        collection(firestore, this.COLLECTION_NAME),
        where('gameType', '==', gameType),
        where('level', '==', level)
      );

      const [higherScoresSnapshot, totalScoresSnapshot] = await Promise.all([
        getDocs(higherScoresQuery),
        getDocs(totalScoresQuery)
      ]);

      const rank = higherScoresSnapshot.size + 1;
      const totalPlayers = totalScoresSnapshot.size;
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

  // Get player's best scores
  async getPlayerBestScores(
    userId: string,
    gameType?: 'colorMatch' | 'reactionTap' | 'colorSnake'
  ): Promise<LeaderboardEntry[]> {
    try {
      let q;
      if (gameType) {
        q = query(
          collection(firestore, this.COLLECTION_NAME),
          where('userId', '==', userId),
          where('gameType', '==', gameType),
          orderBy('score', 'desc'),
          limit(10)
        );
      } else {
        q = query(
          collection(firestore, this.COLLECTION_NAME),
          where('userId', '==', userId),
          orderBy('score', 'desc'),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(q);
      const scores: LeaderboardEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scores.push({
          id: doc.id,
          ...data,
          timestamp: data.createdAt.toDate(),
        } as LeaderboardEntry);
      });

      return scores;
    } catch (error) {
      console.error('❌ Error getting player best scores:', error);
      return [];
    }
  }

  // Get global leaderboard (all games combined)
  async getGlobalLeaderboard(limitCount: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION_NAME),
        orderBy('score', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const scores: LeaderboardEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scores.push({
          id: doc.id,
          ...data,
          timestamp: data.createdAt.toDate(),
        } as LeaderboardEntry);
      });

      return scores;
    } catch (error) {
      console.error('❌ Error getting global leaderboard:', error);
      return [];
    }
  }
}

export const leaderboardService = new LeaderboardService();