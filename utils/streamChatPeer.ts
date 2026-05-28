export type StreamMemberLike = {
  user?: {
    id?: string;
    name?: string;
    image?: string;
  } | null;
};

export type StreamChannelPeer = {
  id: string;
  name: string;
  image?: string;
};

/** Compara IDs de usuário Stream (podem variar caixa/hífens). */
export function normalizeStreamUserId(id: string | undefined | null): string {
  return (id ?? '').trim().toLowerCase().replace(/-/g, '');
}

export function isSameStreamUser(
  a: string | undefined | null,
  b: string | undefined | null,
): boolean {
  const na = normalizeStreamUserId(a);
  const nb = normalizeStreamUserId(b);
  return na.length > 0 && na === nb;
}

/** Outro participante em canal 1:1 (ignora o usuário logado). */
export function getStreamChannelPeer(
  members: StreamMemberLike[] | Record<string, StreamMemberLike> | undefined | null,
  currentUserId: string | undefined | null,
): StreamChannelPeer | null {
  const me = normalizeStreamUserId(currentUserId);
  if (!me) return null;

  const list = Array.isArray(members) ? members : Object.values(members ?? {});
  for (const member of list) {
    const rawId = member?.user?.id?.trim();
    if (!rawId || isSameStreamUser(rawId, currentUserId)) continue;
    return {
      id: rawId,
      name: member.user?.name?.trim() || 'Usuário',
      image: member.user?.image?.trim() || undefined,
    };
  }
  return null;
}

/** Nome/foto para lista e cabeçalho — prioriza o outro membro, não o nome do canal. */
export function resolveStreamConversationDisplay(params: {
  members: StreamMemberLike[] | Record<string, StreamMemberLike> | undefined | null;
  currentUserId: string | undefined | null;
  channelName?: string | null;
  channelImage?: string | null;
  fallbackId?: string;
}): StreamChannelPeer & { usedChannelMetadata: boolean } {
  const peer = getStreamChannelPeer(params.members, params.currentUserId);
  if (peer) {
    return { ...peer, usedChannelMetadata: false };
  }
  const name = params.channelName?.trim() || 'Conversa';
  return {
    id: params.fallbackId?.trim() || name,
    name,
    image: params.channelImage?.trim() || undefined,
    usedChannelMetadata: true,
  };
}
