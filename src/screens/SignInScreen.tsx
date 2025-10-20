import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import { useAuth } from '../store/useAuthStore';
import { logRegistration } from '../firebase/analytics';
import { userService } from '../firebase/userService';

export const SignInScreen: React.FC = () => {
  const [customUsername, setCustomUsername] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const { login, user } = useAuth();

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  const handleQuickStart = async () => {
    try {
      setIsCreatingAccount(true);
      await login();
      if (user?.uid) logRegistration(user.uid);
    } catch (error: any) {
      Alert.alert(
        'Account Creation Failed',
        error.message || 'Could not create your account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleCreateWithUsername = async () => {
    if (!customUsername.trim()) {
      Alert.alert('Username Required', 'Please enter a username to continue.');
      return;
    }

    if (customUsername.length < 3) {
      Alert.alert('Username Too Short', 'Username must be at least 3 characters long.');
      return;
    }

    if (customUsername.length > 20) {
      Alert.alert('Username Too Long', 'Username must be less than 20 characters long.');
      return;
    }

    try {
      setIsCreatingAccount(true);
      await login(customUsername.trim());
      if (user?.uid) logRegistration(user.uid);
    } catch (error: any) {
      Alert.alert(
        'Account Creation Failed',
        error.message || 'Could not create your account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const generatePreviewUsername = () => {
    return userService.generateRandomUsername();
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.gameTitle}>🎮 Color Rush Arena</Text>
            <Text style={styles.welcomeText}>Welcome to the ultimate color challenge!</Text>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            <View style={styles.signInContainer}>
              <Text style={styles.signInTitle}>Create Your Player Profile</Text>
              <Text style={styles.signInSubtitle}>
                Join millions of players competing in fast-paced color games
              </Text>

              {/* Quick Start Option */}
              <View style={styles.optionContainer}>
                <Text style={styles.optionTitle}>🚀 Quick Start</Text>
                <Text style={styles.optionDescription}>
                  Get started instantly with a random username
                </Text>
                <Text style={styles.previewText}>
                  Preview: {generatePreviewUsername()}
                </Text>
                
                <TouchableOpacity
                  style={styles.quickStartButton}
                  onPress={handleQuickStart}
                  disabled={isCreatingAccount}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#00FFC6', '#00D4AA']}
                    style={styles.quickStartGradient}
                  >
                    {isCreatingAccount ? (
                      <Text style={styles.buttonText}>Creating Account...</Text>
                    ) : (
                      <>
                        <Ionicons name="flash" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Start Playing Now</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Custom Username Option */}
              <View style={styles.optionContainer}>
                <Text style={styles.optionTitle}>✨ Choose Your Username</Text>
                <Text style={styles.optionDescription}>
                  Create a unique identity for the leaderboards
                </Text>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your username"
                    placeholderTextColor="#6B7280"
                    value={customUsername}
                    onChangeText={setCustomUsername}
                    maxLength={20}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isCreatingAccount}
                  />
                  <Text style={styles.characterCount}>
                    {customUsername.length}/20
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.customButton,
                    (!customUsername.trim() || isCreatingAccount) && styles.buttonDisabled
                  ]}
                  onPress={handleCreateWithUsername}
                  disabled={!customUsername.trim() || isCreatingAccount}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      customUsername.trim() && !isCreatingAccount
                        ? ['#8E2DE2', '#4A00E0']
                        : ['#6B7280', '#4B5563']
                    }
                    style={styles.customButtonGradient}
                  >
                    {isCreatingAccount ? (
                      <Text style={styles.buttonText}>Creating Account...</Text>
                    ) : (
                      <>
                        <Ionicons name="person-add" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Create Account</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Features List */}
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>What You Get:</Text>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🏆</Text>
                  <Text style={styles.featureText}>Global leaderboards</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📊</Text>
                  <Text style={styles.featureText}>Detailed statistics</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🎯</Text>
                  <Text style={styles.featureText}>Achievement system</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🔄</Text>
                  <Text style={styles.featureText}>Cross-device sync</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E2DE2',
    fontSize: 18,
    fontFamily: 'Orbitron_400Regular',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  gameTitle: {
    fontSize: 32,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#8E2DE2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  signInContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  signInTitle: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#8E2DE2',
    textShadowRadius: 10,
  },
  signInSubtitle: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  optionContainer: {
    marginBottom: 25,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    marginBottom: 8,
    textShadowColor: '#00FFC6',
    textShadowRadius: 5,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    marginBottom: 15,
    lineHeight: 20,
  },
  previewText: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFD60A',
    textAlign: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  quickStartButton: {
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#00FFC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  quickStartGradient: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(142, 45, 226, 0.3)',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    marginHorizontal: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: 'Orbitron_400Regular',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#6B7280',
    textAlign: 'right',
  },
  customButton: {
    borderRadius: 15,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  customButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featuresContainer: {
    marginTop: 10,
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
  },
});