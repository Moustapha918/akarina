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
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAG_DEFAULTS;

let fetchPromise: Promise<void> | null = null;

/** À appeler une fois au démarrage de l'app. Idempotent. */
export function initFeatureFlags(): Promise<void> {
  if (!fetchPromise) {
    fetchPromise = (async () => {
      await rc.setDefaults(FEATURE_FLAG_DEFAULTS);
      await rc.setConfigSettings({ minimumFetchIntervalMillis: 3_600_000 });
      await rc.fetchAndActivate();
    })();
  }
  return fetchPromise;
}

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return rc.getValue(key).asBoolean();
}
