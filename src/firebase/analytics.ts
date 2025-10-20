import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import app from './config';

let analytics: ReturnType<typeof getAnalytics> | null = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // getAnalytics may fail on unsupported platforms (web only)
  analytics = null;
}


export const logAppOpen = async () => {
  if (analytics) logEvent(analytics, 'app_open');
};


export const logRegistration = async (userId: string) => {
  if (analytics) {
    setUserId(analytics, userId);
    logEvent(analytics, 'user_registered');
  }
};


export const logGameStart = async (gameType: string) => {
  if (analytics) logEvent(analytics, 'game_start', { gameType });
};


export const logGameEnd = async (gameType: string, score: number) => {
  if (analytics) logEvent(analytics, 'game_end', { gameType, score });
};


export const logRetention = async (days: number) => {
  if (analytics) logEvent(analytics, 'user_retention', { days });
};


export const setUserProperty = async (props: Record<string, any>) => {
  if (analytics) setUserProperties(analytics, props);
};
