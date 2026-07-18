import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'akarina_onboarding_done';

// expo-secure-store n'est pas disponible sur web → fallback localStorage
async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

interface OnboardingState {
  isDone: boolean;
  isLoading: boolean;
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({ isDone: false, isLoading: true });

  useEffect(() => {
    getItem(ONBOARDING_KEY).then((value) => {
      setState({ isDone: value === 'true', isLoading: false });
    });
  }, []);

  async function markDone() {
    await setItem(ONBOARDING_KEY, 'true');
    setState({ isDone: true, isLoading: false });
  }

  return { ...state, markDone };
}
