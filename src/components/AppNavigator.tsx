import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SignInScreen } from '../screens/SignInScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { GameScreen } from '../screens/GameScreen';
import { GameOverScreen } from '../screens/GameOverScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { ColorMatchGame } from '../games/colorMatch/ColorMatchGame';
import { ColorMatchEndlessGame } from '../games/colorMatch/ColorMatchEndlessGame';
import { ReactionGame } from '../games/reactionTap/ReactionGame';
import { MemoryRushGame } from '../games/memoryRush/MemoryRushGame';
import { useAuth } from '../store/useAuthStore';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'Games') {
          iconName = focused ? 'game-controller' : 'game-controller-outline';
        } else {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#8E2DE2',
      tabBarInactiveTintColor: '#6B7280',
      tabBarStyle: {
        backgroundColor: '#0F0F1B',
        borderTopColor: '#4A00E030',
      },
      headerStyle: {
        backgroundColor: '#0F0F1B',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen 
      name="Games" 
      component={HomeScreen} 
      options={{
        title: 'Color Rush Arena',
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{
        title: 'Profile',
      }}
    />
  </Tab.Navigator>
);

const AuthenticatedStack = () => (
  <Stack.Navigator 
    initialRouteName="MainTabs"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="GameScreen" component={GameScreen} />
    <Stack.Screen name="ColorMatchGame" component={ColorMatchGame} />
    <Stack.Screen name="ColorMatchEndlessGame" component={ColorMatchEndlessGame} />
    <Stack.Screen name="ReactionGame" component={ReactionGame} />
    <Stack.Screen name="MemoryRushGame" component={MemoryRushGame} />
    <Stack.Screen name="GameOverScreen" component={GameOverScreen} />
    <Stack.Screen name="LeaderboardScreen" component={LeaderboardScreen} />
  </Stack.Navigator>
);

const UnauthenticatedStack = () => (
  <Stack.Navigator 
    initialRouteName="SignIn"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="SignIn" component={SignInScreen} />
  </Stack.Navigator>
);

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#8E2DE2" />
  </View>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedStack /> : <UnauthenticatedStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});