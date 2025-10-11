import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth, initializeAuthListener } from './src/store/useAuthStore';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { GameOverScreen } from './src/screens/GameOverScreen';
import { ColorMatchGame } from './src/games/colorMatch/ColorMatchGame';
import { ReactionGame } from './src/games/reactionTap/ReactionGame';

// Placeholder screens - replace with your actual screens
const ProfileScreen = () => {
  const { user } = useAuth();
  
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>👤 Profile</Text>
      {user ? (
        <View>
          <Text style={styles.subtext}>User ID: {user.uid}</Text>
          <Text style={styles.subtext}>Created: {new Date(user.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.subtext}>Anonymous: {user.isAnonymous ? 'Yes' : 'No'}</Text>
        </View>
      ) : (
        <Text style={styles.subtext}>Not authenticated</Text>
      )}
    </View>
  );
};

const LoadingScreen = () => (
  <View style={styles.loadingScreen}>
    <ActivityIndicator size="large" color="#8E2DE2" />
    <Text style={styles.loadingText}>Initializing...</Text>
  </View>
);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Navigator Component
const MainTabs = () => {
  return (
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
};

export default function App() {
  const { user, isLoading, signInAnonymous } = useAuth();

  useEffect(() => {
    // Initialize Firebase auth listener
    initializeAuthListener();
    
    // Auto sign-in anonymously if no user
    const autoSignIn = async () => {
      if (!isLoading && !user) {
        await signInAnonymous();
      }
    };
    
    autoSignIn();
  }, [isLoading, user, signInAnonymous]);

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0F0F1B" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs} 
          />
          <Stack.Screen 
            name="GameScreen" 
            component={GameScreen} 
          />
          <Stack.Screen 
            name="LeaderboardScreen" 
            component={LeaderboardScreen} 
          />
          <Stack.Screen 
            name="ColorMatchGame" 
            component={ColorMatchGame} 
          />
          <Stack.Screen 
            name="ReactionGame" 
            component={ReactionGame} 
          />
          <Stack.Screen 
            name="GameOverScreen" 
            component={GameOverScreen} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F0F1B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0F0F1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#B8B8D1',
    textAlign: 'center',
    marginBottom: 5,
  },
  loadingText: {
    fontSize: 18,
    color: '#8E2DE2',
    marginTop: 20,
  },
});