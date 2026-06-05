import {
  CARGOS_PRESTADORES,
  type CargoPrestadorId,
} from '@/constants/providerCategories';

export const MAX_PROVIDER_CATEGORIES = 10;

const VALID_IDS = new Set<string>(CARGOS_PRESTADORES.map((c) => c.id));

export function isCargoPrestadorId(value: string): value is CargoPrestadorId {
  return VALID_IDS.has(value);
}

/** Normaliza ID ou label legado para o id da lista fixa quando possível. */
export function normalizeCategoryId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (VALID_IDS.has(lower)) return lower as CargoPrestadorId;
  const byLabel = CARGOS_PRESTADORES.find((c) => c.label.toLowerCase() === lower);
  if (byLabel) return byLabel.id;
  return lower;
}

/** Dedupe case-insensitive; preserva ordem (1ª = principal). */
export function normalizeCategoryIds(raw: string[] | undefined | null): string[] {
  if (!raw?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const id = normalizeCategoryId(item);
    if (!id) continue;
    const key = id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(id);
    if (out.length >= MAX_PROVIDER_CATEGORIES) break;
  }
  return out;
}

export function resolveProviderCategories(source: {
  categories?: string[] | null;
  category?: string | null;
  primaryCategory?: string | null;
}): string[] {
  const fromArray = normalizeCategoryIds(source.categories ?? undefined);
  if (fromArray.length > 0) return fromArray;
  const legacy = source.primaryCategory ?? source.category;
  if (legacy?.trim()) return normalizeCategoryIds([legacy]);
  return [];
}

export function categoryIdToLabel(id: string): string {
  const normalized = normalizeCategoryId(id);
  const found = CARGOS_PRESTADORES.find((c) => c.id === normalized);
  if (found) return found.label;
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function formatCategoriesLabel(ids: string[]): string {
  return ids.map(categoryIdToLabel).join(' · ');
}

export function validateProviderCategoriesForSubmit(ids: CargoPrestadorId[]): string | null {
  if (ids.length === 0) return 'Selecione ao menos um serviço que você presta.';
  if (ids.length > MAX_PROVIDER_CATEGORIES) {
    return `Selecione no máximo ${MAX_PROVIDER_CATEGORIES} serviços.`;
  }
  const seen = new Set<string>();
  for (const id of ids) {
    if (!isCargoPrestadorId(id)) return 'Selecione apenas serviços da lista.';
    const key = id.toLowerCase();
    if (seen.has(key)) return 'Não repita o mesmo serviço.';
    seen.add(key);
  }
  return null;
}

export function providerMatchesCategoryFilter(
  categoryIds: string[] | undefined,
  primaryCategoryId: string | undefined,
  filterId: string,
): boolean {
  if (filterId === 'todos') return true;
  const ids = categoryIds?.length
    ? categoryIds
    : primaryCategoryId
      ? [primaryCategoryId]
      : [];
  return ids.some((id) => normalizeCategoryId(id) === filterId);
}
