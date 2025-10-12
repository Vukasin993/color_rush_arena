export type RootStackParamList = {
  SignIn: undefined;
  MainTabs: undefined;
  GameScreen: { gameType: string; level?: 'easy' | 'medium' | 'hard' };
  LeaderboardScreen: { gameType?: 'colorMatch' | 'reactionTap' | 'colorSnake'; level?: 'easy' | 'medium' | 'hard' };
  ColorMatchGame: { level?: 'easy' | 'medium' | 'hard'; autoStart?: boolean };
  ReactionGame: { level?: 'easy' | 'medium' | 'hard'; autoStart?: boolean };
  GameOverScreen: {
    gameType: 'colorMatch' | 'reactionTap' | 'colorSnake';
    level: 'easy' | 'medium' | 'hard';
    score: number;
    xpEarned: number;
  };
};

export type TabParamList = {
  Games: undefined;
  Profile: undefined;
};