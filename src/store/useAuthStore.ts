import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

// User type for our store
interface AuthUser {
  uid: string;
  createdAt: string;
  isAnonymous: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  signInAnonymous: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
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

      // Actions
      signInAnonymous: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const userCredential = await signInAnonymously(auth);
          const firebaseUser = userCredential.user;
          
          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            isAnonymous: firebaseUser.isAnonymous,
          };
          
          set({ 
            user: authUser, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          
          console.log('✅ Anonymous login successful', authUser);
        } catch (error: any) {
          const errorMessage = error.message || 'Anonymous sign-in failed';
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false,
            user: null 
          });
          console.error('❌ Anonymous login failed:', errorMessage);
        }
      },

      signOut: async () => {
        try {
          await auth.signOut();
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null,
            isLoading: false 
          });
          console.log('👋 User signed out');
        } catch (error: any) {
          const errorMessage = error.message || 'Sign out failed';
          set({ error: errorMessage });
          console.error('❌ Sign out failed:', errorMessage);
        }
      },

      setUser: (user: AuthUser | null) => {
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

// Initialize auth state listener
let authListenerInitialized = false;

export const initializeAuthListener = () => {
  if (authListenerInitialized) return;
  
  authListenerInitialized = true;
  
  onAuthStateChanged(auth, (firebaseUser: User | null) => {
    const { setUser, setLoading } = useAuthStore.getState();
    
    if (firebaseUser) {
      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        isAnonymous: firebaseUser.isAnonymous,
      };
      
      setUser(authUser);
      console.log('🔄 Auth state changed - User authenticated:', authUser.uid);
    } else {
      setUser(null);
      console.log('🔄 Auth state changed - User signed out');
    }
    
    setLoading(false);
  });
};

// Custom hook for easy access to auth state
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    user: store.user,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    error: store.error,
    signInAnonymous: store.signInAnonymous,
    signOut: store.signOut,
    clearError: store.clearError,
  };
};