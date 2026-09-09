import { useState, useEffect, useCallback } from 'react';
import {
  initFeatureFlags,
  isFeatureEnabled,
  FEATURE_FLAG_DEFAULTS,
  FeatureFlagKey,
} from '../services/featureFlags';

// Store global simple (même pattern que useAuthStore) — un seul fetch pour
// toute l'app, tous les écrans se re-rendent une fois le résultat disponible.
let _ready = false;
const _listeners = new Set<() => void>();

function setReady() {
  _ready = true;
  _listeners.forEach((fn) => fn());
}

export function useFeatureFlags() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const rerender = () => forceUpdate((n) => n + 1);
    _listeners.add(rerender);
    if (!_ready) {
      // En cas d'échec du fetch (offline...), on bascule quand même sur les
      // valeurs par défaut plutôt que de laisser l'app bloquée en attente.
      initFeatureFlags().then(setReady).catch(setReady);
    }
    return () => { _listeners.delete(rerender); };
  }, []);

  const isEnabled = useCallback(
    (key: FeatureFlagKey): boolean => (_ready ? isFeatureEnabled(key) : FEATURE_FLAG_DEFAULTS[key]),
    []
  );

  return { ready: _ready, isEnabled };
}
