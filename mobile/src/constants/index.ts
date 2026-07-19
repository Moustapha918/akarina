// ─── KYC ────────────────────────────────────────────────────────────────────
/** Montant max investissable sans vérification KYC (en MRU) */
export const KYC_FREE_THRESHOLD = 5_000;

// ─── Investissement ──────────────────────────────────────────────────────────
/** Montant minimum par investissement (en MRU) */
export const MIN_INVESTMENT_AMOUNT = 1_000;

/** Montant maximum par investissement (en MRU) */
export const MAX_INVESTMENT_AMOUNT = 500_000;

/** Paliers suggérés dans le tunnel (en MRU) */
export const INVESTMENT_PRESETS = [5_000, 10_000, 25_000, 50_000, 100_000];

// ─── Format ──────────────────────────────────────────────────────────────────
/** Préfixe téléphone mauritanien (rétrocompat) */
export const PHONE_PREFIX = '+222';

/** Regex numéro mauritanien (8 chiffres après +222) */
export const MAURITANIAN_PHONE_REGEX = /^\+222[2-4][0-9]{7}$/;

/** Pays supportés pour l'authentification téléphone */
export interface Country {
  code: string;
  flag: string;
  name: string;
  prefix: string;
  digitCount: number;
  placeholder: string;
  regex: RegExp;
}

export const COUNTRIES: Country[] = [
  {
    code: 'MR',
    flag: '🇲🇷',
    name: 'Mauritanie',
    prefix: '+222',
    digitCount: 8,
    placeholder: 'XX XX XX XX',
    regex: /^\+222[2-4][0-9]{7}$/,
  },
  {
    code: 'FR',
    flag: '🇫🇷',
    name: 'France',
    prefix: '+33',
    digitCount: 9,
    placeholder: 'X XX XX XX XX',
    regex: /^\+33[67][0-9]{8}$/,
  },
];

// ─── Couleurs ────────────────────────────────────────────────────────────────
export const COLORS = {
  primary: '#1B4F72',
  primaryLight: '#2E86C1',
  secondary: '#D4AC0D',
  success: '#1E8449',
  danger: '#C0392B',
  warning: '#D68910',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1C2833',
  textSecondary: '#717D7E',
  border: '#D5D8DC',
  disabled: '#ABB2B9',
} as const;

// ─── Bankily ─────────────────────────────────────────────────────────────────
/** Délai de timeout de la simulation Bankily (ms) */
export const BANKILY_SIMULATION_DELAY = 5_000;

// ─── Dev / Test ───────────────────────────────────────────────────────────────
/**
 * Numéros de test pour le mode développement.
 * Bypasse reCAPTCHA et l'envoi SMS réel (Simulator / Expo Go).
 * Clé = numéro complet (+222...), valeur = OTP attendu.
 */
export const DEV_TEST_PHONES: Record<string, string> = {
  '+22220000001': '123456',
};
