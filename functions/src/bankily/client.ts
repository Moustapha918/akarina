import { defineSecret } from 'firebase-functions/params';

/**
 * Identifiants marchand Bankily (B-PAY) — jamais exposés au client mobile.
 * Valeurs injectées via `firebase functions:secrets:set <NAME>`.
 */
export const BANKILY_BASE_URL = defineSecret('BANKILY_BASE_URL');
export const BANKILY_USERNAME = defineSecret('BANKILY_USERNAME');
export const BANKILY_PASSWORD = defineSecret('BANKILY_PASSWORD');
export const BANKILY_CLIENT_ID = defineSecret('BANKILY_CLIENT_ID');

export const BANKILY_SECRETS = [
  BANKILY_BASE_URL,
  BANKILY_USERNAME,
  BANKILY_PASSWORD,
  BANKILY_CLIENT_ID,
];

// ─── Taxonomie d'erreurs ─────────────────────────────────────────────────────
//
// On distingue volontairement 3 familles, car chaque appelant doit réagir
// différemment :
//   - Network  : pas de réponse Bankily exploitable (timeout, DNS, 5xx, JSON
//                invalide). Rejouable pour les appels idempotents (auth,
//                checkTransaction). Pour /payment, c'est le cas dangereux :
//                on ne sait pas si le débit a eu lieu (voir initiatePayment.ts).
//   - Auth     : le marchand lui-même n'a pas pu s'authentifier. Jamais
//                imputable au client final — signal d'alerte opérationnelle.
//   - Rejected : Bankily a répondu proprement avec un errorCode métier non
//                nul (passcode invalide, etc). Définitif, imputable à
//                l'utilisateur.

export class BankilyNetworkError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'BankilyNetworkError';
  }
}

export class BankilyAuthError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'BankilyAuthError';
  }
}

export class BankilyRejectedError extends Error {
  constructor(message: string, readonly errorCode: string | number) {
    super(message);
    this.name = 'BankilyRejectedError';
  }
}

export interface BankilyTokenResponse {
  access_token: string;
  expires_in: string;
  refresh_token: string;
  refresh_expires_in: string;
}

export interface BankilyPaymentResponse {
  errorCode: string | number;
  errorMessage?: string;
  transactionId?: string;
}

export type BankilyTransactionStatus = 'TS' | 'TF' | 'TA';

export interface BankilyCheckTransactionResponse {
  errorCode: string | number;
  errorMessage?: string;
  transactionId?: string;
  status?: BankilyTransactionStatus;
}

const RETRYABLE_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

/**
 * Retry avec backoff exponentiel — réservé aux appels idempotents (auth,
 * checkTransaction). Ne JAMAIS l'utiliser pour /payment : un retry sur un
 * appel qui a peut-être déjà débité risquerait un double débit.
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < RETRYABLE_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < RETRYABLE_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_DELAY_MS * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

/** Un seul essai, sans retry — utilisé pour /payment (voir avertissement ci-dessus). */
async function post<T>(path: string, init: { headers: Record<string, string>; body: string | URLSearchParams }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BANKILY_BASE_URL.value()}${path}`, { method: 'POST', ...init });
  } catch (err) {
    throw new BankilyNetworkError(`Bankily ${path} injoignable`, err);
  }
  if (!res.ok) {
    throw new BankilyNetworkError(`Bankily ${path} a répondu HTTP ${res.status}`);
  }
  try {
    return (await res.json()) as T;
  } catch (err) {
    throw new BankilyNetworkError(`Bankily ${path} a renvoyé une réponse invalide`, err);
  }
}

async function postForm<T>(path: string, body: URLSearchParams): Promise<T> {
  return post<T>(path, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
}

async function postJson<T>(path: string, accessToken: string, payload: unknown): Promise<T> {
  return post<T>(path, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
}

/** POST /authentification — grant_type=password (première authentification marchand). Idempotent → retry. */
export async function fetchNewToken(): Promise<BankilyTokenResponse> {
  try {
    return await withRetry(() =>
      postForm<BankilyTokenResponse>(
        '/authentification',
        new URLSearchParams({
          grant_type: 'password',
          username: BANKILY_USERNAME.value(),
          password: BANKILY_PASSWORD.value(),
          client_id: BANKILY_CLIENT_ID.value(),
        })
      )
    );
  } catch (err) {
    throw new BankilyAuthError('Authentification marchand Bankily impossible', err);
  }
}

/** POST /authentification — grant_type=refresh_token. Idempotent → retry. */
export async function fetchRefreshedToken(refreshToken: string): Promise<BankilyTokenResponse> {
  try {
    return await withRetry(() =>
      postForm<BankilyTokenResponse>(
        '/authentification',
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: BANKILY_CLIENT_ID.value(),
          refresh_token: refreshToken,
        })
      )
    );
  } catch (err) {
    throw new BankilyAuthError('Rafraîchissement du token marchand Bankily impossible', err);
  }
}

/**
 * POST /payment — déclenche le débit sur le passcode fourni par le client.
 * PAS de retry ici : voir l'avertissement sur withRetry. L'appelant
 * (initiatePayment.ts) doit traiter une BankilyNetworkError comme une issue
 * ambiguë, jamais comme un échec franc.
 */
export async function callPayment(
  accessToken: string,
  payload: { clientPhone: string; passcode: string; amount: string; operationId: string; language: string }
): Promise<BankilyPaymentResponse> {
  return postJson<BankilyPaymentResponse>('/payment', accessToken, payload);
}

/** POST /checkTransaction — statut d'une transaction déjà initiée. Idempotent → retry. */
export async function callCheckTransaction(
  accessToken: string,
  operationId: string
): Promise<BankilyCheckTransactionResponse> {
  return withRetry(() =>
    postJson<BankilyCheckTransactionResponse>('/checkTransaction', accessToken, { operationId })
  );
}
