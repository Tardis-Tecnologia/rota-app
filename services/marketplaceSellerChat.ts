import { createStreamChannel } from '@/services/streamChatApi';
import { buildMarketplaceInterestMessage } from '@/utils/marketplaceChat';

export interface OpenMarketplaceSellerChatParams {
  buyerUserId: string;
  sellerId: string;
  sellerName: string;
  listingTitle: string;
  formattedPrice?: string;
  sellerImage?: string | null;
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
  params: OpenMarketplaceSellerChatParams,
): Promise<MarketplaceChatNavigationPayload> {
  const sellerId = params.sellerId.trim();
  const buyerUserId = params.buyerUserId.trim();
  if (!sellerId || !buyerUserId) {
    throw new Error('Não foi possível identificar os participantes da conversa.');
  }
  if (sellerId === buyerUserId) {
    throw new Error('Você não pode enviar mensagem para o seu próprio anúncio.');
  }

  const sellerName = params.sellerName.trim() || 'Anunciante';
  const channel = await createStreamChannel({
    memberIds: [buyerUserId, sellerId],
    name: sellerName,
    image: params.sellerImage?.trim() || undefined,
  });

  return {
    id: sellerId,
    name: sellerName,
    image: params.sellerImage?.trim() || undefined,
    channelType: channel.channelType,
    channelId: channel.channelId,
    cid: channel.cid,
    draftMessage: buildMarketplaceInterestMessage(params.listingTitle, params.formattedPrice),
  };
}
