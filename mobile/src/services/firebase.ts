import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

// Auth, Firestore and Storage all run on the native @react-native-firebase SDK
// (default app auto-initialized from GoogleService-Info.plist / google-services.json)
// so they share a single authenticated session — no cross-SDK token mismatch.

export const db = getFirestore();
export const storage = getStorage();
