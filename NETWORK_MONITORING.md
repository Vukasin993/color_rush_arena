# Internet Connection Monitoring

## Overview
Aplikacija sada ima automatsko praćenje internet konekcije na nivou cele aplikacije. Kada nema interneta, igra se automatski pauzira i prikazuje se ekran koji obaveštava korisnika.

## Implementirane komponente

### 1. **NetworkContext** (`src/context/NetworkContext.tsx`)
- Koristi `@react-native-community/netinfo` za real-time praćenje internet konekcije
- Prati dva parametra:
  - `isConnected`: Da li je uređaj povezan na mrežu (WiFi/mobilni podaci)
  - `isInternetReachable`: Da li internet zaista radi (može biti povezan ali bez interneta)

### 2. **NoInternetScreen** (`src/screens/NoInternetScreen.tsx`)
- Prikazuje se kao fullscreen modal kada nema interneta
- Sadrži:
  - Ikonu "cloud-offline"
  - Objašnjenje problema
  - Tips za rešavanje (provera WiFi, mobilnih podataka, airplane mode, itd.)
  - "Retry Connection" dugme za ponovno testiranje konekcije

### 3. **NetworkGuard** (`src/components/NetworkGuard.tsx`)
- Wrapper komponenta koja obavestava sve child komponente o statusu interneta
- Automatski pokazuje `NoInternetScreen` kada se detektuje gubitak konekcije
- Callbacks:
  - `onConnectionLost`: Poziva se kada se internet izgubi
  - `onConnectionRestored`: Poziva se kada se internet vrati

## Kako funkcioniše u igrama

### ColorMatchEndlessGame
Kada se izgubi internet tokom igre:

1. **Auto-Pause**: Igra se automatski pauzira
   ```typescript
   // Auto-pause when internet is lost
   if (!hasInternet && gameState.gameStarted) {
     setGameState(prev => ({ ...prev, isPaused: true }));
     pauseStartTimeRef.current = Date.now();
   }
   ```

2. **NoInternetScreen Modal**: Prikazuje se preko cele igre (preko NetworkGuard-a na app nivou)

3. **Pause Time Tracking**: Vreme bez interneta se računa kao "pauzirano vreme" i ne utiče na:
   - Anti-slow play mehanizam
   - Timer
   - Required clicks per minute

4. **Kada se internet vrati**:
   - NetworkGuard automatski zatvara NoInternetScreen
   - Igra ostaje pauzirana (korisnik mora ručno da klikne Resume)
   - Svo vreme bez interneta je isključeno iz game timera

## App.tsx integracija

```typescript
<NetworkProvider>
  <NetworkGuard
    onConnectionLost={() => {
      console.log('🔴 Game paused - No internet connection');
    }}
    onConnectionRestored={() => {
      console.log('🟢 Connection restored - Game can continue');
    }}
  >
    <AppNavigator />
  </NetworkGuard>
</NetworkProvider>
```

## Prednosti ovog pristupa

### ✅ Automatsko
- Nema potrebe da korisnik ručno pauzira igru
- Instant detektovanje gubitka konekcije

### ✅ Ne narušava performanse
- Koristi native network state listeners
- Nema polling-a
- Minimalan overhead

### ✅ User-friendly
- Jasne instrukcije šta treba uraditi
- "Retry" dugme za brzo testiranje
- Automatski nastavak kada se konekcija vrati

### ✅ Fer za slow-play detekciju
- Vreme bez interneta se ne računa
- Korisnik ne gubi progress zbog network problema

## Testing

### Kako testirati:
1. **Simulator/Emulator**: 
   - iOS: Settings → toggle WiFi off/on
   - Android: Settings → toggle WiFi/mobile data off/on

2. **Physical Device**:
   - Enable Airplane mode
   - Toggle WiFi off/on
   - Toggle Mobile Data off/on

### Očekivano ponašanje:
1. Igra se automatski pauzira kada se internet izgubi
2. Prikazuje se NoInternetScreen sa instrukcijama
3. "Retry Connection" dugme testira konekciju
4. Kada se internet vrati, modal se zatvara automatski
5. Igra ostaje pauzirana - korisnik može da nastavi kada je spreman

## Budući development

Moguća poboljšanja:
- [ ] Offline mode za neke igre (ako ne zavise od Firebase-a u realtime-u)
- [ ] Sinhronizacija statistike kada se internet vrati
- [ ] Prikaz "reconnecting..." stanja
- [ ] Toast notifikacija za kratke prekide konekcije (< 3 sekunde)
