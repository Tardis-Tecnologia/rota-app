export function buildMarketplaceInterestMessage(
  listingTitle: string,
  formattedPrice?: string,
): string {
  const title = listingTitle.trim() || 'seu anúncio';
  const pricePart = formattedPrice?.trim() ? ` (${formattedPrice.trim()})` : '';
  return `Olá! Tenho interesse em conversar sobre o produto "${title}"${pricePart}. Podemos combinar os detalhes?`;
}
