import { findOrCreateDirectStreamChannel } from '@/services/streamChatApi';
import { buildServiceProviderInterestMessage } from '@/utils/serviceProviderChat';

export interface OpenServiceProviderChatParams {
  currentUserId: string;
  providerOwnerUserId: string;
  providerName: string;
  providerCategoryLabel?: string;
  providerImage?: string | null;
  currentUserDisplayName?: string;
}

export interface ServiceProviderChatNavigationPayload {
  id: string;
  name: string;
  image?: string;
  channelType: string;
  channelId: string;
  cid: string;
  draftMessage: string;
}

export async function prepareServiceProviderChat(
  params: OpenServiceProviderChatParams,
): Promise<ServiceProviderChatNavigationPayload> {
  const currentUserId = params.currentUserId.trim();
  const providerOwnerUserId = params.providerOwnerUserId.trim();
  if (!currentUserId || !providerOwnerUserId) {
    throw new Error('Não foi possível identificar os participantes da conversa.');
  }
  if (currentUserId === providerOwnerUserId) {
    throw new Error('Você não pode conversar consigo mesmo.');
  }

  const providerName = params.providerName.trim() || 'Prestador';
  const channel = await findOrCreateDirectStreamChannel({
    currentUserId,
    currentUserDisplayName: params.currentUserDisplayName?.trim() || 'Usuário',
    peerUserId: providerOwnerUserId,
    peerName: providerName,
    peerImage: params.providerImage?.trim() || undefined,
  });

  return {
    id: providerOwnerUserId,
    name: providerName,
    image: params.providerImage?.trim() || undefined,
    channelType: channel.channelType,
    channelId: channel.channelId,
    cid: channel.cid,
    draftMessage: buildServiceProviderInterestMessage(
      providerName,
      params.providerCategoryLabel,
    ),
  };
}
