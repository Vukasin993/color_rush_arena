import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameStats {
  totalGames: number;
  bestScore: number;
  totalXP: number;
  averageScore: number;
  gameHistory: GameResult[];
}

interface GameResult {
  id: string;
  gameType: 'colorMatch' | 'reactionTap' | 'colorSnake';
  score: number;
  xpEarned: number;
  date: string;
  duration: number;
}

interface GameStore {
  // Game Stats
  colorMatchStats: GameStats;
  reactionTapStats: GameStats;
  totalXP: number;
  
  // Current Game State
  currentGame: {
    type: 'colorMatch' | 'reactionTap' | 'colorSnake' | null;
    score: number;
    timeRemaining: number;
    isPlaying: boolean;
  };
  
  // Actions
  startGame: (gameType: 'colorMatch' | 'reactionTap' | 'colorSnake') => void;
  endGame: (finalScore: number) => void;
  updateScore: (points: number) => void;
  updateTimer: (time: number) => void;
  addGameResult: (result: Omit<GameResult, 'id' | 'date'>) => void;
  resetCurrentGame: () => void;
  
  // Getters
  getTotalGamesPlayed: () => number;
  getBestOverallScore: () => number;
  getGameStats: (gameType: 'colorMatch' | 'reactionTap') => GameStats;
}

const initialStats: GameStats = {
  totalGames: 0,
  bestScore: 0,
  totalXP: 0,
  averageScore: 0,
  gameHistory: [],
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial State
      colorMatchStats: initialStats,
      reactionTapStats: initialStats,
      totalXP: 0,
      currentGame: {
        type: null,
        score: 0,
        timeRemaining: 30,
        isPlaying: false,
      },

      // Actions
      startGame: (gameType) => {
        set({
          currentGame: {
            type: gameType,
            score: 0,
            timeRemaining: 30,
            isPlaying: true,
          },
        });
      },

      endGame: (finalScore) => {
        const state = get();
        const gameType = state.currentGame.type;
        
        if (gameType && (gameType === 'colorMatch' || gameType === 'reactionTap')) {
          // Calculate XP (score * 10 + bonus for high scores)
          const xpEarned = finalScore * 10 + (finalScore > 20 ? 100 : 0);
          
          // Add game result
          get().addGameResult({
            gameType,
            score: finalScore,
            xpEarned,
            duration: 30,
          });
        }
        
        set((state) => ({
          currentGame: {
            ...state.currentGame,
            isPlaying: false,
          },
        }));
      },

      updateScore: (points) => {
        set((state) => ({
          currentGame: {
            ...state.currentGame,
            score: Math.max(0, state.currentGame.score + points),
          },
        }));
      },

      updateTimer: (time) => {
        set((state) => ({
          currentGame: {
            ...state.currentGame,
            timeRemaining: time,
          },
        }));
      },

      addGameResult: (result) => {
        const gameResult: GameResult = {
          ...result,
          id: Date.now().toString(),
          date: new Date().toISOString(),
        };

        set((state) => {
          const gameType = result.gameType;
          if (gameType !== 'colorMatch' && gameType !== 'reactionTap') return state;

          const currentStats = gameType === 'colorMatch' 
            ? state.colorMatchStats 
            : state.reactionTapStats;

          const newHistory = [gameResult, ...currentStats.gameHistory].slice(0, 50); // Keep last 50 games
          const newTotalGames = currentStats.totalGames + 1;
          const newBestScore = Math.max(currentStats.bestScore, result.score);
          const newTotalXP = currentStats.totalXP + result.xpEarned;
          const newAverageScore = newHistory.reduce((sum, game) => sum + game.score, 0) / newHistory.length;

          const updatedStats: GameStats = {
            totalGames: newTotalGames,
            bestScore: newBestScore,
            totalXP: newTotalXP,
            averageScore: Math.round(newAverageScore * 10) / 10,
            gameHistory: newHistory,
          };

          return {
            ...state,
            [gameType === 'colorMatch' ? 'colorMatchStats' : 'reactionTapStats']: updatedStats,
            totalXP: state.totalXP + result.xpEarned,
          };
        });
      },

      resetCurrentGame: () => {
        set({
          currentGame: {
            type: null,
            score: 0,
            timeRemaining: 30,
            isPlaying: false,
          },
        });
      },

      // Getters
      getTotalGamesPlayed: () => {
        const state = get();
        return state.colorMatchStats.totalGames + state.reactionTapStats.totalGames;
      },

      getBestOverallScore: () => {
        const state = get();
        return Math.max(state.colorMatchStats.bestScore, state.reactionTapStats.bestScore);
      },

      getGameStats: (gameType) => {
        const state = get();
        return gameType === 'colorMatch' ? state.colorMatchStats : state.reactionTapStats;
      },
    }),
    {
      name: 'game-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        colorMatchStats: state.colorMatchStats,
        reactionTapStats: state.reactionTapStats,
        totalXP: state.totalXP,
      }),
    }
  )
);

// Hook for easy access to game store
export const useGame = () => {
  const store = useGameStore();
  return {
    // Current game state
    currentGame: store.currentGame,
    
    // Stats
    colorMatchStats: store.colorMatchStats,
    reactionTapStats: store.reactionTapStats,
    totalXP: store.totalXP,
    
    // Actions
    startGame: store.startGame,
    endGame: store.endGame,
    updateScore: store.updateScore,
    updateTimer: store.updateTimer,
    resetCurrentGame: store.resetCurrentGame,
    
    // Computed values
    totalGames: store.getTotalGamesPlayed(),
    bestScore: store.getBestOverallScore(),
  };
};
