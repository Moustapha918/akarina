import { getApp } from '@react-native-firebase/app';
import { getFunctions } from '@react-native-firebase/functions';

// Toutes les Cloud Functions du projet sont déployées en europe-west1 —
// @react-native-firebase cible us-central1 par défaut, la région doit donc
// toujours être explicite.
export const functionsInstance = getFunctions(getApp(), 'europe-west1');
