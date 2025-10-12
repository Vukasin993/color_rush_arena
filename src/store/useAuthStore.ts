import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService, UserProfile } from '../firebase/userService';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  login: (customUsername?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  updateGameStats: (
    gameType: 'colorMatch' | 'reactionTap',
    level: 'easy' | 'medium' | 'hard',
    score: number,
    xpEarned: number
  ) => Promise<void>;
  syncUserData: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Create the store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      login: async (customUsername?: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const user = await userService.createUser(customUsername);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log('✅ User logged in successfully');
        } catch (error: any) {
          const errorMessage = error.message || 'Login failed';
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false,
            user: null 
          });
          console.error('❌ Login failed:', errorMessage);
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          
          await userService.clearUserData();
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
          console.log('✅ User logged out successfully');
        } catch (error: any) {
          const errorMessage = error.message || 'Logout failed';
          set({ error: errorMessage, isLoading: false });
          console.error('❌ Logout failed:', errorMessage);
          throw error;
        }
      },

      deleteAccount: async () => {
        try {
          const { user } = get();
          if (!user) throw new Error('No user found');
          
          set({ isLoading: true, error: null });
          
          await userService.deleteUserAccount(user.uid);
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
          console.log('✅ User account deleted successfully');
        } catch (error: any) {
          const errorMessage = error.message || 'Account deletion failed';
          set({ error: errorMessage, isLoading: false });
          console.error('❌ Account deletion failed:', errorMessage);
          throw error;
        }
      },

      updateUsername: async (newUsername: string) => {
        try {
          const { user } = get();
          if (!user) throw new Error('No user found');
          
          await userService.updateUsername(user.uid, newUsername);
          
          const updatedUser = { ...user, username: newUsername };
          set({ user: updatedUser });
          
          console.log('✅ Username updated successfully');
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to update username';
          set({ error: errorMessage });
          console.error('❌ Failed to update username:', errorMessage);
          throw error;
        }
      },

      updateGameStats: async (
        gameType: 'colorMatch' | 'reactionTap',
        level: 'easy' | 'medium' | 'hard',
        score: number,
        xpEarned: number
      ) => {
        try {
          const { user } = get();
          if (!user) throw new Error('No user found');
          
          // Update stats locally first to prevent re-renders
          const gameStats = gameType === 'colorMatch' ? user.colorMatchStats : user.reactionTapStats;
          const updatedGameStats = {
            ...gameStats,
            totalGames: gameStats.totalGames + 1,
            bestScore: Math.max(gameStats.bestScore, score),
            averageScore: Math.round(
              (gameStats.averageScore * gameStats.totalGames + score) / (gameStats.totalGames + 1)
            ),
            totalXP: gameStats.totalXP + xpEarned,
            [`${level}Completed`]: gameStats[`${level}Completed` as keyof typeof gameStats] + 1,
          };

          const updatedUser = {
            ...user,
            [`${gameType}Stats`]: updatedGameStats,
            totalGames: user.totalGames + 1,
            totalXP: user.totalXP + xpEarned,
            level: Math.floor((user.totalXP + xpEarned) / 1000) + 1,
          };

          // Update store immediately with calculated values - no AsyncStorage read needed
          set({ user: updatedUser });
          
          // Update Firebase in background
          await userService.updateGameStats(user.uid, gameType, level, score, xpEarned);
          
          console.log('✅ Game stats updated successfully (store updated immediately)');
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to update game stats';
          set({ error: errorMessage });
          console.error('❌ Failed to update game stats:', errorMessage);
          throw error;
        }
      },

      syncUserData: async () => {
        try {
          const { user } = get();
          if (!user) return;
          
          const syncedUser = await userService.syncUserData(user.uid);
          if (syncedUser) {
            set({ user: syncedUser });
            console.log('✅ User data synced successfully');
          }
        } catch (error: any) {
          console.error('❌ Failed to sync user data:', error);
        }
      },

      checkAuthStatus: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const hasUser = await userService.hasUser();
          
          if (hasUser) {
            const user = await userService.getUserFromStorage();
            if (user) {
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
              
              // Sync with Firebase in background
              get().syncUserData();
              return;
            }
          }
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to check auth status';
          console.error('❌ Failed to check auth status:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      setUser: (user: UserProfile | null) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false 
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'color-rush-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Custom hook for easy access to auth state
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    user: store.user,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    error: store.error,
    login: store.login,
    logout: store.logout,
    deleteAccount: store.deleteAccount,
    updateUsername: store.updateUsername,
    updateGameStats: store.updateGameStats,
    syncUserData: store.syncUserData,
    checkAuthStatus: store.checkAuthStatus,
    clearError: store.clearError,
  };
};