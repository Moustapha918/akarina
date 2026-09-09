import { onCall } from 'firebase-functions/v2/https';
import { getRemoteConfig } from 'firebase-admin/remote-config';
import { FLAG_PREFIX, requireAdmin } from './shared';

export interface FeatureFlagSummary {
  key: string;
  enabled: boolean;
  description: string;
}

/** Liste tous les paramètres Remote Config préfixés `feature_` (réservé ADMIN). */
export const listFeatureFlags = onCall(
  { region: 'europe-west1' },
  async (request): Promise<{ flags: FeatureFlagSummary[] }> => {
    requireAdmin(request);

    const template = await getRemoteConfig().getTemplate();
    const flags = Object.entries(template.parameters)
      .filter(([key]) => key.startsWith(FLAG_PREFIX))
      .map(([key, param]) => ({
        key,
        description: param.description ?? '',
        enabled: !!param.defaultValue && 'value' in param.defaultValue && param.defaultValue.value === 'true',
      }));

    return { flags };
  }
);
