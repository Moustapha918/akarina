import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// SDK compat requis par expo-firebase-recaptcha
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// TODO: Remplacer par les valeurs réelles depuis la console Firebase
// https://console.firebase.google.com → Paramètres du projet → Vos applications
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

// SDK modulaire (utilisé dans les services)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// SDK compat (requis par expo-firebase-recaptcha)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
