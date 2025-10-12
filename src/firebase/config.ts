import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';

// Firebase configuration - using environment variables
const firebaseConfig = {
  apiKey: "AIzaSyCT8DgEY8Gx9LA5Qa0ccCBTNoA3cZ3Nbtg",
  authDomain: "colorrusharena.firebaseapp.com",
  projectId: "colorrusharena",
  storageBucket: "colorrusharena.firebasestorage.app",
  messagingSenderId: "768614624509",
  appId: "1:768614624509:android:fade9616b8d620d5b3e294",
};

// Initialize Firebase only once
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase app initialized');
} else {
  app = getApp();
}

// Initialize Auth - Firebase automatically handles persistence on React Native
const auth = getAuth(app);
console.log('🔐 Firebase Auth initialized');

// Initialize Firestore
const firestore = getFirestore(app);
console.log('📊 Firestore initialized');

export { auth, firestore };
export default app;