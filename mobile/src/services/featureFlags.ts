import remoteConfig from '@react-native-firebase/remote-config';

const rc = remoteConfig();

/**
 * Valeurs de repli embarquées dans l'app — utilisées tant que le premier
 * fetch n'a pas abouti (offline, premier lancement) ou s'il échoue.
 * Toute clé ajoutée ici doit être préfixée `feature_` (convention partagée
 * avec functions/src/featureFlags et l'admin).
 */
export const FEATURE_FLAG_DEFAULTS = {
  feature_example: false,
  // Projets/filtre de type CONSTRUCTION (vs LAND_FLIP) — activé par défaut pour
  // ne rien casser tant que le flag n'est pas explicitement désactivé côté admin.
  feature_construction: true,
  // Affichage du ROI estimé (%, gain, total) sur les cartes projet, l'écran
  // détail, le tunnel d'investissement et le portefeuille. Ne masque PAS le
  // taux mentionné dans le texte légal du contrat (art. 3) — un engagement
  // contractuel ne doit pas dépendre d'un flag produit.
  feature_roi_estimate: true,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAG_DEFAULTS;

// En dev, on veut voir l'effet d'un flag togglé côté admin immédiatement au
// prochain lancement de l'app plutôt que d'attendre jusqu'à 1h de cache.
const MINIMUM_FETCH_INTERVAL_MILLIS = __DEV__ ? 0 : 3_600_000;

let fetchPromise: Promise<void> | null = null;

/** À appeler une fois au démarrage de l'app. Idempotent. */
export function initFeatureFlags(): Promise<void> {
  if (!fetchPromise) {
    fetchPromise = (async () => {
      await rc.setDefaults(FEATURE_FLAG_DEFAULTS);
      await rc.setConfigSettings({ minimumFetchIntervalMillis: MINIMUM_FETCH_INTERVAL_MILLIS });
      await rc.fetchAndActivate();
    })();
  }
  return fetchPromise;
}

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return rc.getValue(key).asBoolean();
}
