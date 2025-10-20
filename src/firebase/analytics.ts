import * as Analytics from 'expo-firebase-analytics';

export const logAppOpen = async () => {
  await Analytics.logEvent('app_open');
};

export const logRegistration = async (userId: string) => {
  await Analytics.setUserId(userId);
  await Analytics.logEvent('user_registered');
};

export const logGameStart = async (gameType: string) => {
  await Analytics.logEvent('game_start', { gameType });
};

export const logGameEnd = async (gameType: string, score: number) => {
  await Analytics.logEvent('game_end', { gameType, score });
};

export const logRetention = async (days: number) => {
  await Analytics.logEvent('user_retention', { days });
};

export const setUserProperty = async (props: Record<string, any>) => {
  await Analytics.setUserProperties(props);
};
