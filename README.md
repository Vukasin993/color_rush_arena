# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

# Color Rush Arena - Firebase Setup

## 🔥 Firebase Authentication Setup

This app uses Firebase Anonymous Authentication with Zustand state management.

### Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Enable **Authentication** → **Sign-in method** → **Anonymous** ✅
4. Go to **Project Settings** → **General** → **Your apps**
5. Add a **Web app** and copy the config

### Step 2: Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase config values in `.env`:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=1:your_messaging_sender_id:web:your_app_id
   ```

### Step 3: Run the App

```bash
npm start
```

## 🏗️ Architecture

```
src/
├── firebase/
│   └── config.ts          # Firebase initialization
└── store/
    └── useAuthStore.ts    # Zustand auth store with persistence
```

## 🔐 Authentication Features

- ✅ **Anonymous sign-in** on app start
- ✅ **Persistent auth state** using AsyncStorage
- ✅ **Auto re-authentication** on app restart
- ✅ **Zustand store** for global auth state
- ✅ **useAuth() hook** for easy access in components

## 🎯 Usage in Components

```tsx
import { useAuth } from './src/store/useAuthStore';

function MyComponent() {
  const { user, isAuthenticated, signInAnonymous, signOut } = useAuth();
  
  return (
    <View>
      {isAuthenticated ? (
        <Text>Welcome, User ID: {user?.uid}</Text>
      ) : (
        <Button onPress={signInAnonymous}>Sign In</Button>
      )}
    </View>
  );
}
```

## 📱 Console Output

When authentication works correctly, you'll see:
```
🔥 Firebase app initialized
🔐 Firebase Auth initialized
✅ Anonymous login successful
```

## 🚀 Get Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up Firebase (see steps above)

3. Start the app

   ```bash
    npx expo start
   ```

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
