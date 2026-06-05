const COMMERCIAL_STREAM_USER_PREFIX = 'commercial_';

export function toCommercialStreamUserId(commercialAccountId: string): string {
  const trimmed = commercialAccountId.trim();
  if (trimmed.startsWith(COMMERCIAL_STREAM_USER_PREFIX)) {
    return trimmed;
  }
  return `${COMMERCIAL_STREAM_USER_PREFIX}${trimmed}`;
}
