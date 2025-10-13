export type RootStackParamList = {
  SignIn: undefined;
  MainTabs: undefined;
  GameScreen: { gameType: string; level?: 'easy' | 'medium' | 'hard' | 'extreme' | 'extra-hard' };
  LeaderboardScreen: { gameType?: 'colorMatch' | 'reactionTap' | 'colorSnake' | 'memoryRush'; level?: 'easy' | 'medium' | 'hard' | 'extreme' | 'extra-hard' };
  ColorMatchGame: { level?: 'easy' | 'medium' | 'hard'; autoStart?: boolean; bonusTime?: number };
  ReactionGame: { level?: 'easy' | 'medium' | 'hard'; autoStart?: boolean; bonusTime?: number };
  MemoryRushGame: { level?: 'easy' | 'medium' | 'hard' | 'extreme' | 'extra-hard'; autoStart?: boolean };
  GameOverScreen: {
    gameType: 'colorMatch' | 'reactionTap' | 'colorSnake' | 'memoryRush';
    level: 'easy' | 'medium' | 'hard' | 'extreme' | 'extra-hard';
    score: number;
    xpEarned: number;
  };
};

export type TabParamList = {
  Games: undefined;
  Profile: undefined;
};