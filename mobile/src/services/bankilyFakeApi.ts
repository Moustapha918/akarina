import type { InitiatePaymentResult, BankilyTransactionStatus } from './bankilyService';

/** Latence artificielle pour garder un comportement asynchrone réaliste côté UI (polling, spinners). */
const FAKE_LATENCY_MS = 400;

function fakeDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FAKE_LATENCY_MS));
}

/**
 * Fake local de l'API Bankily (branche feature/mock-bankily-api) : ne fait
 * aucun appel réseau ni Cloud Function, simule toujours le chemin succès.
 * Sert à tester le tunnel de paiement sans dépendre de l'infrastructure
 * Bankily/Firebase Functions.
 */
export class BankilyFakeApi {
  async initiatePayment(
    investmentId: string,
    _clientPhone: string,
    _passcode: string
  ): Promise<InitiatePaymentResult> {
    return fakeDelay({ transactionId: `MOCK-TX-${investmentId}` });
  }

  async checkTransactionStatus(investmentId: string): Promise<BankilyTransactionStatus> {
    return fakeDelay<BankilyTransactionStatus>('TS');
  }
}
