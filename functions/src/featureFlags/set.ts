import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getRemoteConfig } from 'firebase-admin/remote-config';
import { FLAG_PREFIX, requireAdmin } from './shared';

interface SetFeatureFlagRequest {
  key: string;
  enabled: boolean;
  description?: string;
}

/**
 * Crée ou bascule un feature flag (réservé ADMIN) — republie le template
 * Remote Config avec le paramètre mis à jour. La clé doit commencer par
 * `feature_` : c'est cette convention qui distingue les flags des autres
 * paramètres Remote Config que le projet pourrait utiliser plus tard.
 */
export const setFeatureFlag = onCall<SetFeatureFlagRequest>(
  { region: 'europe-west1' },
  async (request): Promise<{ success: true }> => {
    requireAdmin(request);

    const { key, enabled, description } = request.data;
    if (!key || !key.startsWith(FLAG_PREFIX)) {
      throw new HttpsError('invalid-argument', `La clé doit commencer par "${FLAG_PREFIX}".`);
    }

    const remoteConfig = getRemoteConfig();
    const template = await remoteConfig.getTemplate();

    const existing = template.parameters[key];
    template.parameters[key] = {
      ...existing,
      defaultValue: { value: String(enabled) },
      valueType: 'BOOLEAN',
      description: description ?? existing?.description ?? '',
    };

    await remoteConfig.validateTemplate(template);
    await remoteConfig.publishTemplate(template);

    return { success: true };
  }
);
