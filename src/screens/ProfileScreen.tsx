import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
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
import { CustomModal } from '../components/CustomModal';

export const ProfileScreen: React.FC = () => {
  const { user, updateUsername, deleteAccount } = useAuth();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFinalDeleteModal, setShowFinalDeleteModal] = useState(false);

  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername.trim() === user?.username) {
      setIsEditingUsername(false);
      setNewUsername(user?.username || '');
      return;
    }

    if (newUsername.length < 3) {
      Alert.alert('Username Too Short', 'Username must be at least 3 characters long.');
      return;
    }

    if (newUsername.length > 20) {
      Alert.alert('Username Too Long', 'Username must be less than 20 characters long.');
      return;
    }

    try {
      setIsUpdating(true);
      await updateUsername(newUsername.trim());
      setIsEditingUsername(false);
      Alert.alert('Success', 'Username updated successfully!');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Could not update username.');
      setNewUsername(user?.username || '');
    } finally {
      setIsUpdating(false);
    }
  };



  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    setShowFinalDeleteModal(true);
  };

  const handleFinalDelete = async () => {
    try {
      setShowFinalDeleteModal(false);
      await deleteAccount();
      // Navigate to login screen after successful deletion
      // The auth state change should automatically redirect
    } catch (error: any) {
      Alert.alert(
        'Deletion Failed', 
        error.message || 'Could not delete account. Please try again.'
      );
    }
  };

  const getPlayerLevel = (totalXP: number) => {
    return Math.floor(totalXP / 1000) + 1;
  };

  const getXPForNextLevel = (totalXP: number) => {
    const currentLevel = getPlayerLevel(totalXP);
    const xpForNextLevel = currentLevel * 1000;
    return xpForNextLevel - totalXP;
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No user data</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
      
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>👤 Player Profile</Text>
          <Text style={styles.subtitle}>Manage your account and view stats</Text>
        </View>

        {/* Username Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Username</Text>
          {isEditingUsername ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.textInput}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="Enter new username"
                placeholderTextColor="#6B7280"
                maxLength={20}
                autoFocus
                editable={!isUpdating}
              />
              <Text style={styles.characterCount}>{newUsername.length}/20</Text>
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditingUsername(false);
                    setNewUsername(user.username);
                  }}
                  disabled={isUpdating}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isUpdating && styles.buttonDisabled]}
                  onPress={handleUpdateUsername}
                  disabled={isUpdating}
                >
                  <Text style={styles.saveButtonText}>
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.usernameContainer}>
              <Text style={styles.username}>{user.username}</Text>
              {/* <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditingUsername(true)}
              >
                <Ionicons name="pencil" size={16} color="#8E2DE2" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity> */}
            </View>
          )}
        </View>

        {/* Player Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getPlayerLevel(user.totalXP)}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user.totalXP}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user.totalGames}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getXPForNextLevel(user.totalXP)}</Text>
              <Text style={styles.statLabel}>XP to Next Level</Text>
            </View>
          </View>
        </View>

        {/* Game Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Color Match Stats</Text>
          <View style={styles.gameStats}>
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Best Score:</Text>
              <Text style={styles.gameStatValue}>{user.colorMatchStats.bestScore}</Text>
            </View>
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Average Score:</Text>
              <Text style={styles.gameStatValue}>{user.colorMatchStats.averageScore}</Text>
            </View>
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Games Played:</Text>
              <Text style={styles.gameStatValue}>{user.colorMatchStats.totalGames}</Text>
            </View>
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Total XP:</Text>
              <Text style={styles.gameStatValue}>{user.colorMatchStats.totalXP}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Reaction Tap Stats</Text>
          <View style={styles.gameStats}>
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Best Score:</Text>
              <Text style={styles.gameStatValue}>{user.reactionTapStats.bestScore}</Text>
            </View>
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Average Score:</Text>
              <Text style={styles.gameStatValue}>{user.reactionTapStats.averageScore}</Text>
            </View>
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Games Played:</Text>
              <Text style={styles.gameStatValue}>{user.reactionTapStats.totalGames}</Text>
            </View>
            <View style={styles.gameStatRow}>
              <Text style={styles.gameStatLabel}>Total XP:</Text>
              <Text style={styles.gameStatValue}>{user.reactionTapStats.totalXP}</Text>
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <View style={styles.accountInfo}>
            <Text style={styles.accountInfoText}>
              Created: {new Date(user.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.accountInfoText}>
              User ID: {user.uid}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          {/* <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['#FF3B30', '#FF2D55']}
              style={styles.logoutButtonGradient}
            >
              <Ionicons name="log-out" size={20} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity> */}
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <LinearGradient
              colors={['#8B0000', '#DC143C']}
              style={styles.deleteButtonGradient}
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Delete Account Modal */}
      <CustomModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        message={`⚠️ PERMANENT ACTION WARNING ⚠️

This will PERMANENTLY delete:
• All your game progress and scores
• ${user?.totalXP || 0} XP and Level ${Math.floor((user?.totalXP || 0) / 1000) + 1} status
• ${user?.totalGames || 0} game records and statistics
• Your account and username "${user?.username}"

This action cannot be undone and you will be signed out immediately.

Are you absolutely certain you want to proceed?`}
        icon="warning"
        iconColor="#FF3B30"
        buttons={[
          {
            text: 'Cancel',
            onPress: () => setShowDeleteModal(false),
            style: 'secondary',
          },
          {
            text: 'DELETE FOREVER',
            onPress: handleConfirmDelete,
            style: 'destructive',
          },
        ]}
      />

      {/* Final Confirmation Modal */}
      <CustomModal
        visible={showFinalDeleteModal}
        onClose={() => setShowFinalDeleteModal(false)}
        title="Final Confirmation"
        message={`🚨 LAST CHANCE TO CANCEL! 🚨

You are about to permanently delete your account "${user?.username}".

This is your FINAL WARNING - this action cannot be undone!

Are you absolutely sure you want to delete your account forever?`}
        icon="skull"
        iconColor="#8B0000"
        buttons={[
          {
            text: 'Cancel',
            onPress: () => setShowFinalDeleteModal(false),
            style: 'secondary',
          },
          {
            text: 'Yes, Delete My Account',
            onPress: handleFinalDelete,
            style: 'destructive',
          },
        ]}
      />
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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#8E2DE2',
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    marginBottom: 15,
    textShadowColor: '#00FFC6',
    textShadowRadius: 5,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  username: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#8E2DE2',
  },
  editContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    marginBottom: 10,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
  },
  saveButton: {
    flex: 1,
    backgroundColor: 'rgba(142, 45, 226, 0.8)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  gameStats: {
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  gameStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameStatLabel: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
  },
  gameStatValue: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
  },
  accountInfo: {
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  accountInfoText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    marginBottom: 5,
  },

  deleteButton: {
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    marginTop: 15,
  },
  deleteButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
});