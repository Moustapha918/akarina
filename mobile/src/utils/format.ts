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
    COMPLETED: '#717D7E',
  };
  return colors[status] ?? '#717D7E';
}
