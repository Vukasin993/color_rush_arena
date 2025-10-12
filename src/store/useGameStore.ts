import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameStats {
  totalGames: number;
  bestScore: number;
  totalXP: number;
  averageScore: number;
  gameHistory: GameResult[];
  unlockedLevels: {
    easy: boolean;
    medium: boolean;
    hard: boolean;
  };
}

interface GameResult {
  id: string;
  gameType: 'colorMatch' | 'reactionTap' | 'colorSnake';
  level: 'easy' | 'medium' | 'hard';
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
    level: 'easy' | 'medium' | 'hard';
    score: number;
    timeRemaining: number;
    isPlaying: boolean;
  };
  
  // Actions
  startGame: (gameType: 'colorMatch' | 'reactionTap' | 'colorSnake', level?: 'easy' | 'medium' | 'hard') => void;
  endGame: (finalScore: number) => void;
  updateScore: (points: number) => void;
  updateTimer: (time: number) => void;
  addGameResult: (result: Omit<GameResult, 'id' | 'date'>) => void;
  resetCurrentGame: () => void;
  unlockLevel: (gameType: 'colorMatch' | 'reactionTap', level: 'medium' | 'hard') => void;
  checkLevelUnlock: (gameType: 'colorMatch' | 'reactionTap', totalXP: number) => void;
  
  // Getters
  getTotalGamesPlayed: () => number;
  getBestOverallScore: () => number;
  getGameStats: (gameType: 'colorMatch' | 'reactionTap') => GameStats;
  isLevelUnlocked: (gameType: 'colorMatch' | 'reactionTap', level: 'easy' | 'medium' | 'hard') => boolean;
}

const initialStats: GameStats = {
  totalGames: 0,
  bestScore: 0,
  totalXP: 0,
  averageScore: 0,
  gameHistory: [],
  unlockedLevels: {
    easy: true,
    medium: false,
    hard: false,
  },
};

// XP requirements for level unlocks
const LEVEL_UNLOCK_REQUIREMENTS = {
  medium: 500, // 500 XP to unlock medium
  hard: 1500,  // 1500 XP to unlock hard
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
        level: 'easy',
        score: 0,
        timeRemaining: 30,
        isPlaying: false,
      },

      // Actions
      startGame: (gameType, level = 'easy') => {
        set({
          currentGame: {
            type: gameType,
            level,
            score: 0,
            timeRemaining: 30,
            isPlaying: true,
          },
        });
      },

      endGame: (finalScore) => {
        const state = get();
        const gameType = state.currentGame.type;
        const level = state.currentGame.level;
        
        if (gameType && (gameType === 'colorMatch' || gameType === 'reactionTap')) {
          // Calculate XP (score * 10 + bonus for high scores)
          const xpEarned = finalScore * 10 + (finalScore > 20 ? 100 : 0);
          
          // Add game result
          get().addGameResult({
            gameType,
            level,
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
          const totalXPNew = state.totalXP + result.xpEarned;

          // Check for level unlocks
          const currentUnlockedLevels = currentStats.unlockedLevels || {
            easy: true,
            medium: false,
            hard: false,
          };
          const newUnlockedLevels = { ...currentUnlockedLevels };
          if (newTotalXP >= LEVEL_UNLOCK_REQUIREMENTS.medium && !newUnlockedLevels.medium) {
            newUnlockedLevels.medium = true;
          }
          if (newTotalXP >= LEVEL_UNLOCK_REQUIREMENTS.hard && !newUnlockedLevels.hard) {
            newUnlockedLevels.hard = true;
          }

          const updatedStats: GameStats = {
            totalGames: newTotalGames,
            bestScore: newBestScore,
            totalXP: newTotalXP,
            averageScore: Math.round(newAverageScore * 10) / 10,
            gameHistory: newHistory,
            unlockedLevels: newUnlockedLevels,
          };

          return {
            ...state,
            [gameType === 'colorMatch' ? 'colorMatchStats' : 'reactionTapStats']: updatedStats,
            totalXP: totalXPNew,
          };
        });
      },

      resetCurrentGame: () => {
        set({
          currentGame: {
            type: null,
            level: 'easy',
            score: 0,
            timeRemaining: 30,
            isPlaying: false,
          },
        });
      },

      unlockLevel: (gameType, level) => {
        set((state) => {
          const currentStats = gameType === 'colorMatch' 
            ? state.colorMatchStats 
            : state.reactionTapStats;

          const currentUnlockedLevels = currentStats.unlockedLevels || {
            easy: true,
            medium: false,
            hard: false,
          };

          const updatedStats = {
            ...currentStats,
            unlockedLevels: {
              ...currentUnlockedLevels,
              [level]: true,
            },
          };

          return {
            ...state,
            [gameType === 'colorMatch' ? 'colorMatchStats' : 'reactionTapStats']: updatedStats,
          };
        });
      },

      checkLevelUnlock: (gameType, totalXP) => {
        const state = get();
        const currentStats = gameType === 'colorMatch' 
          ? state.colorMatchStats 
          : state.reactionTapStats;

        const currentUnlockedLevels = currentStats.unlockedLevels || {
          easy: true,
          medium: false,
          hard: false,
        };

        if (totalXP >= LEVEL_UNLOCK_REQUIREMENTS.medium && !currentUnlockedLevels.medium) {
          get().unlockLevel(gameType, 'medium');
        }
        if (totalXP >= LEVEL_UNLOCK_REQUIREMENTS.hard && !currentUnlockedLevels.hard) {
          get().unlockLevel(gameType, 'hard');
        }
      },

      isLevelUnlocked: (gameType, level) => {
        const state = get();
        const currentStats = gameType === 'colorMatch' 
          ? state.colorMatchStats 
          : state.reactionTapStats;
        
        // Handle case where unlockedLevels might not exist in persisted data
        if (!currentStats.unlockedLevels) {
          return level === 'easy'; // Only easy is unlocked by default
        }
        
        return currentStats.unlockedLevels[level];
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
      migrate: (persistedState: any, version: number) => {
        // Ensure unlockedLevels exists in persisted stats
        if (persistedState && typeof persistedState === 'object') {
          if (persistedState.colorMatchStats && !persistedState.colorMatchStats.unlockedLevels) {
            persistedState.colorMatchStats.unlockedLevels = {
              easy: true,
              medium: false,
              hard: false,
            };
          }
          if (persistedState.reactionTapStats && !persistedState.reactionTapStats.unlockedLevels) {
            persistedState.reactionTapStats.unlockedLevels = {
              easy: true,
              medium: false,
              hard: false,
            };
          }
        }
        return persistedState;
      },
      version: 1,
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
    addGameResult: store.addGameResult,
    unlockLevel: store.unlockLevel,
    checkLevelUnlock: store.checkLevelUnlock,
    isLevelUnlocked: store.isLevelUnlocked,
    
    // Computed values
    totalGames: store.getTotalGamesPlayed(),
    bestScore: store.getBestOverallScore(),
    getGameStats: store.getGameStats,
  };
};
