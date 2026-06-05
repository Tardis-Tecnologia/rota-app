import { resolveChatPeerPhotoUrl } from '@/services/chatPeerPhotos';
import { findOrCreateDirectStreamChannel } from '@/services/streamChatApi';
import { buildMarketplaceInterestMessage } from '@/utils/marketplaceChat';
import { toCommercialStreamUserId } from '@/utils/streamUserId';

export interface OpenMarketplaceSellerChatParams {
  buyerUserId: string;
  sellerId: string;
  sellerName: string;
  listingTitle: string;
  formattedPrice?: string;
  sellerImage?: string | null;
  sellerIsCommercial?: boolean;
}

export interface MarketplaceChatNavigationPayload {
  id: string;
  name: string;
  image?: string;
  channelType: string;
  channelId: string;
  cid: string;
  draftMessage: string;
}

export async function prepareMarketplaceSellerChat(
  params: OpenMarketplaceSellerChatParams & { buyerDisplayName?: string },
): Promise<MarketplaceChatNavigationPayload> {
  const sellerId = params.sellerId.trim();
  const buyerUserId = params.buyerUserId.trim();
  if (!sellerId || !buyerUserId) {
    throw new Error('Não foi possível identificar os participantes da conversa.');
  }
  if (sellerId === buyerUserId) {
    throw new Error('Você não pode enviar mensagem para o seu próprio anúncio.');
  }

  const sellerName = params.sellerName.trim() || 'Loja';
  const peerUserId =
    params.sellerIsCommercial === false
      ? sellerId
      : toCommercialStreamUserId(sellerId);
  const sellerPhoto =
    params.sellerImage?.trim() ||
    (params.sellerIsCommercial === false
      ? await resolveChatPeerPhotoUrl(sellerId)
      : undefined) ||
    undefined;
  const channel = await findOrCreateDirectStreamChannel({
    currentUserId: buyerUserId,
    currentUserDisplayName: params.buyerDisplayName?.trim() || 'Usuário',
    peerUserId,
    peerName: sellerName,
    peerImage: sellerPhoto,
  });

  return {
    id: peerUserId,
    name: sellerName,
    image: sellerPhoto,
    channelType: channel.channelType,
    channelId: channel.channelId,
    cid: channel.cid,
    draftMessage: buildMarketplaceInterestMessage(params.listingTitle, params.formattedPrice),
  };
}
