import { getUserById } from '@/services/authApi';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const photoCache = new Map<string, string | null>();

export function isChatPeerUserId(value: string | undefined | null): boolean {
  const id = value?.trim() ?? '';
  return id.length > 0 && UUID_REGEX.test(id);
}

/** Foto de perfil do usuário (API Rota), com cache em memória. */
export async function resolveChatPeerPhotoUrl(
  userId: string | undefined | null,
): Promise<string | null> {
  const id = userId?.trim() ?? '';
  if (!isChatPeerUserId(id)) return null;

  if (photoCache.has(id)) {
    return photoCache.get(id) ?? null;
  }

  try {
    const profile = await getUserById(id);
    const url = profile.photoUrl?.trim() || null;
    photoCache.set(id, url);
    return url;
  } catch {
    photoCache.set(id, null);
    return null;
  }
}

export async function resolveChatPeerPhotoMap(
  userIds: Array<string | undefined | null>,
): Promise<Map<string, string>> {
  const unique = [
    ...new Set(
      userIds
        .map((id) => id?.trim() ?? '')
        .filter((id) => isChatPeerUserId(id)),
    ),
  ];

  const map = new Map<string, string>();
  await Promise.all(
    unique.map(async (id) => {
      const url = await resolveChatPeerPhotoUrl(id);
      if (url) map.set(id, url);
    }),
  );
  return map;
}
