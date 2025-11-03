import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Orbitron_400Regular,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type MoreGamesScreenProps = NativeStackScreenProps<RootStackParamList, 'MoreGamesScreen'>;

export const MoreGamesScreen: React.FC<MoreGamesScreenProps> = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
  });

  const handleOpenMemoryQuest = async () => {
    const url = 'https://play.google.com/store/apps/details?id=com.vukasin93.memory_game&hl=en';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Can't open URL:", url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1B" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1A1A2E', '#16213E']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>🎮</Text>
          <Text style={styles.headerTitle}>More Games</Text>
          <Text style={styles.headerSubtitle}>Check out our other games!</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Memory Quest Card */}
        <View style={styles.gameCard}>
          <LinearGradient
            colors={['rgba(142, 45, 226, 0.2)', 'rgba(74, 0, 224, 0.1)']}
            style={styles.gameCardGradient}
          >
            {/* Game Image */}
            <View style={styles.imageContainer}>
              <Image
                source={require('../../assets/memory_quest_image.png')}
                style={styles.gameImage}
                resizeMode="cover"
              />
            </View>

            {/* Game Info */}
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>🧠 Memory Quest</Text>
              <Text style={styles.gameDescription}>
                Test your memory with this challenging and addictive memory game! 
                Match pairs of cards, beat your high score, and compete with friends.
              </Text>
              
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Features:</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00FFC6" />
                  <Text style={styles.featureText}>Multiple difficulty levels</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00FFC6" />
                  <Text style={styles.featureText}>Beautiful card designs</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00FFC6" />
                  <Text style={styles.featureText}>Track your progress</Text>
                </View>
              </View>

              {/* Download Button */}
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleOpenMemoryQuest}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8E2DE2', '#4A00E0']}
                  style={styles.downloadButtonGradient}
                >
                  <Ionicons name="download" size={20} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* More Games Coming Soon */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonEmoji}>🚀</Text>
          <Text style={styles.comingSoonTitle}>More Games Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            We&apos;re working on exciting new games. Stay tuned!
          </Text>
        </View>
      </ScrollView>
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
  header: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 45, 226, 0.3)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 45, 226, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: -20,
  },
  headerEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
    textShadowColor: '#8E2DE2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  gameCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
    borderRadius: 20,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  gameInfo: {
    gap: 15,
  },
  gameTitle: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#8E2DE2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  gameDescription: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    gap: 8,
    paddingVertical: 10,
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#00FFC6',
    marginBottom: 5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
  },
  downloadButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  downloadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  downloadButtonText: {
    fontSize: 16,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
  },
  comingSoonCard: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 45, 226, 0.3)',
  },
  comingSoonEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    fontFamily: 'Orbitron_400Regular',
    color: '#B8B8D1',
    textAlign: 'center',
    lineHeight: 20,
  },
});
