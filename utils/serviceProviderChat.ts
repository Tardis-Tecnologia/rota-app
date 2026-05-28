export function buildServiceProviderInterestMessage(
  providerName: string,
  categoryLabel?: string,
): string {
  const safeName = providerName.trim() || 'seu serviço';
  const safeCategory = categoryLabel?.trim();
  if (safeCategory) {
    return `Olá! Tenho interesse no seu serviço de ${safeCategory} (${safeName}). Podemos conversar sobre os detalhes?`;
  }
  return `Olá! Tenho interesse no seu serviço (${safeName}). Podemos conversar sobre os detalhes?`;
}
