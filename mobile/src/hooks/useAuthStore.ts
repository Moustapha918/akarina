import { useState, useEffect, useCallback } from 'react';
import auth from '@react-native-firebase/auth';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { db } from '../services/firebase';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

// Store global simple (sans lib externe)
let _state: AuthState = { user: null, isLoading: true };
const _listeners = new Set<() => void>();
let _unsubscribeAuth: (() => void) | null = null;
let _initialized = false;

function setState(partial: Partial<AuthState>) {
  _state = { ..._state, ...partial };
  _listeners.forEach((fn) => fn());
}

export function useAuthStore() {
  const [, forceUpdate] = useState(0);

  // Abonnement au store global — nettoyé correctement au démontage
  useEffect(() => {
    const rerender = () => forceUpdate((n) => n + 1);
    _listeners.add(rerender);
    return () => { _listeners.delete(rerender); };
  }, []);

  const initialize = useCallback(() => {
    if (_initialized) return;
    _initialized = true;

    _unsubscribeAuth = auth().onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ user: null, isLoading: false });
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setState({ user: { id: firebaseUser.uid, ...userDoc.data() } as User, isLoading: false });
        } else {
          // Utilisateur Firebase Auth sans profil Firestore (inscription incomplète)
          setState({ user: null, isLoading: false });
        }
      } catch {
        setState({ user: null, isLoading: false });
      }
    });
  }, []);

  const setUser = useCallback((user: User | null) => {
    setState({ user });
  }, []);

  const signOut = useCallback(() => {
    _unsubscribeAuth?.();
    _unsubscribeAuth = null;
    _initialized = false;
    setState({ user: null, isLoading: false });
  }, []);

  return {
    user: _state.user,
    isLoading: _state.isLoading,
    initialize,
    setUser,
    signOut,
  };
}
