export type RootStackParamList = {
  MainTabs: undefined;
  GameScreen: { gameType: string };
  LeaderboardScreen: undefined;
  ColorMatchGame: undefined;
  ReactionGame: undefined;
  GameOverScreen: {
    gameType: 'colorMatch' | 'reactionTap' | 'colorSnake';
    score: number;
    xpEarned: number;
  };
};

export type TabParamList = {
  Games: undefined;
  Profile: undefined;
};