import { ProjectType, ExitStrategy } from '../types';

/**
 * Formate un montant en MRU lisible.
 * Ex: 1200000 → "1 200 000 MRU"
 * Ex: 1500000 → "1,5M MRU"
 */
export function formatMRU(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M MRU`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k MRU`;
  }
  return `${amount.toLocaleString('fr-FR')} MRU`;
}

/**
 * Pourcentage de collecte d'un projet (0–100).
 */
export function collectProgress(collected: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((collected / target) * 100), 100);
}

/**
 * Label lisible du statut projet.
 */
export function projectStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: 'Ouvert',
    FUNDED: 'Financé',
    CONSTRUCTION: 'En construction',
    RENTING: 'En location',
    COMPLETED: 'Terminé',
  };
  return labels[status] ?? status;
}

/**
 * Couleur du badge selon le statut.
 */
export function projectStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: '#1E8449',
    FUNDED: '#2E86C1',
    CONSTRUCTION: '#D68910',
    RENTING: '#7D3C98',
    COMPLETED: '#717D7E',
  };
  return colors[status] ?? '#717D7E';
}

/**
 * Label du type de projet.
 */
export function projectTypeLabel(type: ProjectType): string {
  return type === 'CONSTRUCTION' ? 'Construction' : 'Achat-Revente Terrain';
}

/**
 * Emoji du type de projet.
 */
export function projectTypeIcon(type: ProjectType): string {
  return type === 'CONSTRUCTION' ? '🏗️' : '🏕️';
}

/**
 * Label de la stratégie de sortie.
 */
export function exitStrategyLabel(strategy: ExitStrategy): string {
  return strategy === 'RENTAL' ? 'Location' : 'Vente';
}

/**
 * Calcule le loyer mensuel estimé pour un investisseur.
 * = (montant investi / objectif projet) × loyer mensuel total
 */
export function estimatedMonthlyRent(
  investmentAmount: number,
  targetAmount: number,
  monthlyRent: number
): number {
  if (targetAmount === 0) return 0;
  return Math.round((investmentAmount / targetAmount) * monthlyRent);
}

/**
 * Calcule le retour annuel estimé via le taux ROI.
 * Pour RENTAL : retour annuel = investissement × roiEstimate%
 * Ramené au mois : / 12
 */
export function estimatedMonthlyFromROI(
  investmentAmount: number,
  roiEstimate: number
): number {
  return Math.round((investmentAmount * roiEstimate) / 100 / 12);
}

/**
 * Flux de statuts selon le type de projet.
 */
export function getStatusFlow(
  projectType: ProjectType,
  exitStrategy?: ExitStrategy
): string[] {
  if (projectType === 'LAND_FLIP') return ['OPEN', 'FUNDED', 'COMPLETED'];
  if (exitStrategy === 'RENTAL') return ['OPEN', 'FUNDED', 'CONSTRUCTION', 'RENTING', 'COMPLETED'];
  return ['OPEN', 'FUNDED', 'CONSTRUCTION', 'COMPLETED'];
}
