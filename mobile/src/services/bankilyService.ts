import { BANKILY_SIMULATION_DELAY } from '../constants';

export interface BankilyPaymentResult {
  success: boolean;
  bankilyRef: string;
  errorMessage?: string;
}

/**
 * Simule un paiement Push Bankily (BPM).
 *
 * En production, cette fonction appellerait l'API BPM pour déclencher un OTP
 * sur le téléphone de l'utilisateur. La réponse définitive viendrait via webhook.
 * Ici, on simule un délai de traitement bancaire de BANKILY_SIMULATION_DELAY ms.
 */
export async function initiatePayment(
  amount: number,
  phone: string,
  investmentId: string
): Promise<BankilyPaymentResult> {
  // Référence de transaction simulée
  const bankilyRef = `BNK-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  // Simule le délai réseau + traitement bancaire
  await new Promise<void>((resolve) => setTimeout(resolve, BANKILY_SIMULATION_DELAY));

  // Simulation : 95 % de succès, 5 % d'échec aléatoire
  const success = Math.random() > 0.05;

  if (!success) {
    return {
      success: false,
      bankilyRef,
      errorMessage: 'Solde insuffisant ou transaction refusée par la banque.',
    };
  }

  return { success: true, bankilyRef };
}
