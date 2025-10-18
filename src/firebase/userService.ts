import { 
  doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, 
  collection, getDocs, query, where 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, deleteUser } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from './config';


export interface UserProfile {
  uid: string;
  username: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt: Date;
  
  // Game Statistics
  totalGames: number;
  totalXP: number;
  level: number;
  
  // Color Match Stats
  colorMatchStats: {
    totalGames: number;
    bestScore: number;
    averageScore: number;
    totalXP: number;
    easyCompleted: number;
    mediumCompleted: number;
    hardCompleted: number;
  };
  
  // Reaction Tap Stats
  reactionTapStats: {
    totalGames: number;
    bestScore: number;
    averageScore: number;
    totalXP: number;
    easyCompleted: number;
    mediumCompleted: number;
    hardCompleted: number;
  };
  
  // Memory Rush Stats
  memoryRushStats: {
    totalGames: number;
    bestScore: number;
    averageScore: number;
    totalXP: number;
    easyCompleted: number;
    mediumCompleted: number;
    hardCompleted: number;
    extremeCompleted: number;
    extraHardCompleted: number;
    highestLevel?: number;
  };
  
  // Preferences
  preferences: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    theme: 'dark' | 'light';
  };
}

class UserService {
  private readonly STORAGE_KEY = '@color_rush_user';
  private readonly USERS_COLLECTION = 'users';
  private auth = getAuth();
  private authInitialized = false;

  // Generate random username
  generateRandomUsername(): string {
    const adjectives = [
      'Swift', 'Bright', 'Quick', 'Sharp', 'Smart', 'Bold', 'Fast', 'Cool',
      'Epic', 'Fire', 'Neon', 'Cyber', 'Ultra', 'Mega', 'Super', 'Hyper'
    ];
    
    const nouns = [
      'Gamer', 'Player', 'Master', 'Hero', 'Champion', 'Warrior', 'Legend',
      'Ace', 'Pro', 'Ninja', 'Wizard', 'Runner', 'Hunter', 'Falcon', 'Tiger'
    ];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 9999) + 1;
    
    return `${adjective}${noun}${number}`;
  }

  // Create default user profile
  private createDefaultProfile(uid: string, username: string): UserProfile {
    // Dodeli random avatar od 1 do 21
    const avatarNumber = Math.floor(Math.random() * 29) + 1;
    return {
      uid,
      username,
      avatar: `${avatarNumber}.svg`,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      totalGames: 0,
      totalXP: 0,
      level: 1,
      colorMatchStats: {
        totalGames: 0,
        bestScore: 0,
        averageScore: 0,
        totalXP: 0,
        easyCompleted: 0,
        mediumCompleted: 0,
        hardCompleted: 0,
      },
      reactionTapStats: {
        totalGames: 0,
        bestScore: 0,
        averageScore: 0,
        totalXP: 0,
        easyCompleted: 0,
        mediumCompleted: 0,
        hardCompleted: 0,
      },
      memoryRushStats: {
        totalGames: 0,
        bestScore: 0,
        averageScore: 0,
        totalXP: 0,
        easyCompleted: 0,
        mediumCompleted: 0,
        hardCompleted: 0,
        extremeCompleted: 0,
        extraHardCompleted: 0,
        highestLevel: 1,
      },
      preferences: {
        soundEnabled: true,
        vibrationEnabled: true,
        theme: 'dark',
      },
    };
  }

  // Generate unique user ID
    // Firebase Anonymous Authentication
  private async ensureAuthenticated(): Promise<string> {
    console.log('🔑 ensureAuthenticated called');
    
    return new Promise((resolve, reject) => {
      if (this.auth.currentUser) {
        // Already authenticated
        console.log('✅ User already authenticated:', this.auth.currentUser.uid);
        resolve(this.auth.currentUser.uid);
        return;
      }

      console.log('🔐 No current user, signing in anonymously...');
      
      // Sign in anonymously
      signInAnonymously(this.auth)
        .then((userCredential) => {
          console.log('✅ Anonymous sign-in successful:', userCredential.user.uid);
          resolve(userCredential.user.uid);
        })
        .catch((error) => {
          console.error('❌ Anonymous sign-in failed:', error);
          console.error('❌ Auth error details:', JSON.stringify(error, null, 2));
          reject(error);
        });
    });
  }

  // Initialize Firebase Auth listener
  initializeAuth(): void {
    if (this.authInitialized) {
      console.log('🔑 Firebase Auth already initialized');
      return;
    }

    console.log('🔑 Initializing Firebase Auth listener...');
    
    onAuthStateChanged(this.auth, (user) => {
      console.log('� Auth state changed:', user?.uid || 'No user');
      if (user) {
        console.log('✅ User is authenticated with UID:', user.uid);
      } else {
        console.log('❌ No authenticated user found');
      }
    });
    
    this.authInitialized = true;
    console.log('✅ Firebase Auth listener initialized');
  }

  // Save user to AsyncStorage
  async saveUserToStorage(user: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      console.log('✅ User saved to AsyncStorage');
    } catch (error) {
      console.error('❌ Failed to save user to AsyncStorage:', error);
      throw error;
    }
  }

  // Get user from AsyncStorage
  async getUserFromStorage(): Promise<UserProfile | null> {
    try {
      const userStr = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (userStr) {
        const user = JSON.parse(userStr);
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        user.lastLoginAt = new Date(user.lastLoginAt);
        return user;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get user from AsyncStorage:', error);
      return null;
    }
  }

  // Create new user
  async createUser(customUsername?: string): Promise<UserProfile> {
    try {
      // ✅ Ensure Firebase Authentication first
      const firebaseUID = await this.ensureAuthenticated();
      const username = customUsername || this.generateRandomUsername();
      
      const userProfile = this.createDefaultProfile(firebaseUID, username);
      
      // ✅ Now user is authenticated, save to Firestore
      await setDoc(doc(firestore, this.USERS_COLLECTION, firebaseUID), {
        ...userProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      
      // Save to AsyncStorage
      await this.saveUserToStorage(userProfile);
      
      console.log('✅ User created successfully:', username, 'UID:', firebaseUID);
      return userProfile;
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    console.log('🔄 Starting updateUserProfile:', { uid, updates });
    
    try {
      // ✅ Ensure authentication
      console.log('🔑 Ensuring authentication...');
      await this.ensureAuthenticated();
      console.log('✅ Authentication confirmed');
      
      // Update in Firebase
      console.log('🔥 Updating Firebase document...');
      await updateDoc(doc(firestore, this.USERS_COLLECTION, uid), {
        ...updates,
        lastLoginAt: serverTimestamp(),
      });
      console.log('✅ Firebase document updated');
      
      // Update in AsyncStorage
      console.log('💾 Updating AsyncStorage...');
      const currentUser = await this.getUserFromStorage();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates, lastLoginAt: new Date() };
        await this.saveUserToStorage(updatedUser);
        console.log('✅ AsyncStorage updated');
      } else {
        console.log('⚠️ No current user found for AsyncStorage update');
      }
      
      console.log('✅ User profile updated successfully');
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      console.error('❌ Update error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  // Provera da li je username zauzet
  async isUsernameTaken(username: string): Promise<boolean> {
    const q = query(
      collection(firestore, this.USERS_COLLECTION),
      where('username', '==', username)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }
  // Update username
  async updateUsername(uid: string, newUsername: string): Promise<void> {
    try {
      // Provera unikatnosti
      const taken = await this.isUsernameTaken(newUsername);
      if (taken) {
        throw new Error('Username is already taken.');
      }
      await this.updateUserProfile(uid, { username: newUsername });
      console.log('✅ Username updated to:', newUsername);
    } catch (error) {
      console.error('❌ Failed to update username:', error);
      throw error;
    }
  }

  // Update game statistics
  async updateGameStats(
    uid: string, 
    gameType: 'colorMatch' | 'reactionTap' | 'memoryRush',
    level: 'easy' | 'medium' | 'hard' | 'extreme' | 'extra-hard',
    score: number,
    xpEarned: number,
    highestLevel?: number
  ): Promise<void> {
    console.log('📊 Starting updateGameStats:', { uid, gameType, level, score, xpEarned });
    
    try {
      console.log('📖 Getting current user from storage...');
      const currentUser = await this.getUserFromStorage();
      
      if (!currentUser) {
        console.error('❌ No current user found in storage');
        throw new Error('No user found');
      }
      
      console.log('👤 Current user loaded:', currentUser.username);
      console.log('📊 Current user stats:', JSON.stringify(currentUser, null, 2));

      const gameStats = gameType === 'colorMatch' 
        ? currentUser.colorMatchStats 
        : gameType === 'reactionTap' 
        ? currentUser.reactionTapStats
        : currentUser.memoryRushStats;
      
      console.log('🎮 Current game stats:', JSON.stringify(gameStats, null, 2));
      
      if (!gameStats || typeof gameStats !== 'object') {
        console.error('❌ Invalid game stats structure:', gameStats);
        throw new Error(`Invalid ${gameType} stats structure`);
      }
      
      // Update game stats
      let updatedGameStats: any = {
        ...gameStats,
        totalGames: gameStats.totalGames + 1,
        bestScore: Math.max(gameStats.bestScore, score),
        averageScore: Math.round(
          (gameStats.averageScore * gameStats.totalGames + score) / (gameStats.totalGames + 1)
        ),
        totalXP: gameStats.totalXP + xpEarned,
        [`${level === 'extra-hard' ? 'extraHard' : level}Completed`]: gameStats[`${level === 'extra-hard' ? 'extraHard' : level}Completed` as keyof typeof gameStats] + 1,
      };
      // Dodaj highestLevel za memoryRush
      if (gameType === 'memoryRush' && typeof highestLevel === 'number') {
        updatedGameStats.highestLevel = Math.max(
          (gameStats as UserProfile['memoryRushStats']).highestLevel || 1,
          highestLevel
        );
      }

      console.log('🔄 Updated game stats:', JSON.stringify(updatedGameStats, null, 2));

      const updates = {
        [`${gameType}Stats`]: updatedGameStats,
        totalGames: currentUser.totalGames + 1,
        totalXP: currentUser.totalXP + xpEarned,
        level: Math.floor((currentUser.totalXP + xpEarned) / 1000) + 1, // Level up every 1000 XP
      };

      console.log('📝 Profile updates to apply:', JSON.stringify(updates, null, 2));
      console.log('🔄 Calling updateUserProfile...');
      
      await this.updateUserProfile(uid, updates);
      
      console.log('✅ Game stats updated successfully');
    } catch (error) {
      console.error('❌ Failed to update game stats:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  // Sync user data with Firebase
  async syncUserData(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(firestore, this.USERS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        // Convert Firestore timestamps to Date objects
        userData.createdAt = userData.createdAt || new Date();
        userData.lastLoginAt = userData.lastLoginAt || new Date();
        
        // Save synced data to AsyncStorage
        await this.saveUserToStorage(userData);
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to sync user data:', error);
      return null;
    }
  }

  // Clear user data (logout)
  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ User data cleared');
    } catch (error) {
      console.error('❌ Failed to clear user data:', error);
      throw error;
    }
  }

  // Check if user exists in storage
  async hasUser(): Promise<boolean> {
    try {
      const user = await this.getUserFromStorage();
      return user !== null;
    } catch (error) {
      console.error('❌ Failed to check user existence:', error);
      return false;
    }
  }

  // Delete user account completely
  async deleteUserAccount(uid: string): Promise<void> {
    try {
      console.log('🗑️ Starting account deletion for UID:', uid);
      
      // Delete user document from Firestore
      console.log('🔥 Deleting Firebase document...');
      await deleteDoc(doc(firestore, this.USERS_COLLECTION, uid));
      console.log('✅ Firebase document deleted');
      
      // Clear AsyncStorage
      console.log('💾 Clearing AsyncStorage...');
      await this.clearUserData();
      console.log('✅ AsyncStorage cleared');
      
      // Delete Firebase Auth user (anonymous user)
      console.log('🔐 Deleting Firebase Auth user...');
      if (this.auth.currentUser) {
        await deleteUser(this.auth.currentUser);
        console.log('✅ Firebase Auth user deleted');
      } else {
        console.log('⚠️ No current Firebase Auth user found');
      }
      
      console.log('✅ User account deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete user account:', error);
      throw error;
    }
  }
}

export const userService = new UserService();