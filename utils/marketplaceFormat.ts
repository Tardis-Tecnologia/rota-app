export function parseMarketplacePriceValue(price: string | number): number {
  if (typeof price === 'number') {
    return Number.isFinite(price) ? price : 0;
  }
  const normalized = price.replace(',', '.').trim();
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function formatMarketplacePrice(price: string | number): string {
  const value = parseMarketplacePriceValue(price);
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parsePriceInputToReais(text: string): number | null {
  const cleaned = text.replace(/[^\d,.-]/g, '').replace(',', '.');
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function formatPriceForInput(price: number): string {
  return price.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
