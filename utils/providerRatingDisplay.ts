export function parseProviderRatingAverage(value: unknown): number {
  if (value == null || value === '') return 0;
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

export function parseProviderRatingCount(value: unknown): number {
  if (value == null || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** Ex.: `4,5` ou `4,5 · 12` (mesmo padrão do perfil). */
export function formatProviderRatingLabel(rating: number, reviewCount: number): string {
  const avg = rating.toFixed(1).replace('.', ',');
  if (reviewCount > 0) return `${avg} · ${reviewCount}`;
  return avg;
}
