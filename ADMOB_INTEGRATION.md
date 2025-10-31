# Google AdMob Integration Guide

## Setup Complete! ✅

Google AdMob je uspešno integrisan u Color Rush Arena aplikaciju.

## Ad Unit IDs

### Production (Real Ads)
- **App ID**: `ca-app-pub-5126134005676463~7784244991`
- **Banner**: `ca-app-pub-5126134005676463/5883063864`
- **Interstitial**: `ca-app-pub-5126134005676463/5555760802`
- **Rewarded**: `ca-app-pub-5126134005676463/3070850650`

### Development (Test Ads)
Test ad unit IDs se automatski koriste u development modu.

## Implementirane komponente

### 1. **AdBanner Component**
Banner reklama koja se prikazuje na dnu ekrana.

```tsx
import { AdBanner } from '../components/AdBanner';

<AdBanner /> // Default BANNER size
<AdBanner size={BannerAdSize.LARGE_BANNER} />
```

### 2. **useInterstitialAd Hook**
Interstitial ad za prikaz između levela/igara.

```tsx
import { useInterstitialAd } from '../hooks/useInterstitialAd';

const MyComponent = () => {
  const { loaded, showAd } = useInterstitialAd();
  
  const handleGameOver = async () => {
    if (loaded) {
      await showAd(); // Prikaži interstitial ad
    }
    // Navigate to next screen
    navigation.navigate('GameOverScreen');
  };
  
  return <Button onPress={handleGameOver} title="Finish" />;
};
```

### 3. **useRewardedAd Hook**
Rewarded ad za "Watch Ad & Continue" funkcionalnost.

```tsx
import { useRewardedAd } from '../hooks/useRewardedAd';

const MyComponent = () => {
  const { loaded, showAd, earnedReward } = useRewardedAd();
  
  const handleWatchAd = async () => {
    if (loaded) {
      await showAd();
      
      // Check if user earned reward
      if (earnedReward) {
        console.log('✅ User watched the ad! Continue game...');
        continueGame();
      } else {
        console.log('❌ User closed ad without watching');
      }
    }
  };
  
  return <Button onPress={handleWatchAd} title="Watch Ad & Continue" />;
};
```

## Gde dodati reklame

### ✅ **Banner Ads**
Prikazuj na dnu sledećih ekrana:
- **HomeScreen** - Main menu
- **LeaderboardScreen** - Leaderboard
- **ProfileScreen** - User profile
- **GameOverScreen** - Nakon završene igre

```tsx
// Example: HomeScreen.tsx
<View style={styles.container}>
  <Text>Home Screen Content</Text>
  
  {/* Banner Ad at bottom */}
  <View style={styles.adContainer}>
    <AdBanner />
  </View>
</View>
```

### ✅ **Interstitial Ads**
Prikazuj nakon završene igre (end level):
- Nakon završetka **ColorMatchGame**
- Nakon završetka **MemoryRushGame**
- Nakon završetka **ReactionGame**
- Možda nakon svake 3. igre u **EndlessMode**

```tsx
// Example: GameOverScreen.tsx ili unutar igre
const handleGameEnd = async () => {
  if (interstitialLoaded) {
    await showInterstitialAd();
  }
  // Navigate to GameOverScreen
  navigation.navigate('GameOverScreen', { score, xp });
};
```

### ✅ **Rewarded Ads**
Koristi za "Watch Ad & Continue" funkcionalnost:
- **ColorMatchEndlessGame** - Watch ad modal (wrong answer or slow play)
- **PauseModal** - Watch ad to continue opcija
- **MemoryRushGame** - Watch ad to continue after game over
- Bilo koja igra gde korisnik može da gleda reklamu za bonus (extra life, continue, itd.)

```tsx
// Example: ColorMatchEndlessGame.tsx
const handleWatchAd = useCallback(async () => {
  setShowWatchAdModal(false);
  
  if (rewardedAdLoaded) {
    await showRewardedAd();
    
    if (earnedReward) {
      // User watched the ad - continue game
      continueGame();
    } else {
      // User closed ad - end game
      handleGameOver();
    }
  }
}, [rewardedAdLoaded, showRewardedAd, earnedReward]);
```

## Best Practices

### 1. **Preload Ads**
Ads se automatski učitavaju kada koristiš hook. Hook automatski reloaduje ad nakon što se prikaže.

### 2. **Check if Loaded**
Uvek proveri da li je reklama učitana pre nego što je prikažeš:

```tsx
if (loaded) {
  await showAd();
} else {
  // Fallback - nastavi bez reklame
  console.warn('Ad not loaded, continuing without ad');
  continueWithoutAd();
}
```

### 3. **Frequency Capping**
Ne prikazuj previše reklama:
- **Banner**: Stalno prikazan na određenim ekranima
- **Interstitial**: Max 1 po igri ili nakon svake 3. igre
- **Rewarded**: Samo kada korisnik klikne "Watch Ad"

### 4. **User Experience**
- **Ne blokiraj game flow** - Reklame treba da budu prirodan deo iskustva
- **Rewarded ads su optional** - Korisnik sam bira da li želi da gleda
- **Interstitial ads** - Prikazuj samo na prirodnim break pointovima (kraj igre, prelazak levela)

## Development vs Production

Aplikacija automatski koristi **test ads** u development modu i **real ads** u production:

```typescript
const __DEV__ = process.env.NODE_ENV === 'development';

export const getAdUnitId = (adType) => {
  return __DEV__ ? TEST_AD_UNIT_IDS[adType] : AD_UNIT_IDS[adType];
};
```

## Testing

1. **Development**: Koristi test ads (automatski)
2. **Production Build**: Napravi production build sa `npm run build:apk`
3. **Test Device**: Dodaj svoj test device ID u `admob.ts`:

```typescript
testDeviceIdentifiers: ['EMULATOR', 'YOUR_DEVICE_ID_HERE'],
```

## Troubleshooting

### Ad not showing?
- Proveri da li je internet konekcija aktivna
- Proveri console logove (`console.log` ispisi)
- Proveri da li je ad loaded (`loaded === true`)
- Proveri da li je AdMob inicijalizovan u App.tsx

### "Ad failed to load"?
- Proveri Ad Unit IDs u `admob.ts`
- Proveri internet konekciju
- Proveri AdMob konzolu da li su ads enabled

### Test ads in production?
- Obavezno koristi production build (`npm run build:apk`)
- Proveri `process.env.NODE_ENV` vrednost

## Next Steps

1. ✅ Dodaj `<AdBanner />` na Home, Leaderboard, Profile, GameOver screens
2. ✅ Integriši `useInterstitialAd()` na kraju igara
3. ✅ Zameni simulirane "Watch Ad" funkcije sa `useRewardedAd()`
4. ✅ Testiraj sve ad tipove
5. ✅ Napravi production build i proveri real ads

Srećno! 🚀
