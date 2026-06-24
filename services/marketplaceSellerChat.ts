import { contactCommercialStore } from '@/services/commercialForumApi';
import { getWhitelabelHostId } from '@/services/authApi';
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
  autoSentDraftMessageId?: string;
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
  const isCommercialSeller = params.sellerIsCommercial !== false;
  const draftMessage = buildMarketplaceInterestMessage(
    params.listingTitle,
    params.formattedPrice,
  );
  const sellerPhoto =
    params.sellerImage?.trim() ||
    (!isCommercialSeller ? await resolveChatPeerPhotoUrl(sellerId) : undefined) ||
    undefined;

  if (isCommercialSeller) {
    const channel = await contactCommercialStore(
      sellerId,
      draftMessage,
      getWhitelabelHostId(),
    );
    const peerUserId = toCommercialStreamUserId(sellerId);
    return {
      id: peerUserId,
      name: sellerName,
      image: sellerPhoto,
      channelType: channel.channelType,
      channelId: channel.channelId,
      cid: channel.cid,
      draftMessage,
      autoSentDraftMessageId: channel.messageId?.trim() || undefined,
    };
  }

  const channel = await findOrCreateDirectStreamChannel({
    currentUserId: buyerUserId,
    currentUserDisplayName: params.buyerDisplayName?.trim() || 'Usuário',
    peerUserId: sellerId,
    peerName: sellerName,
    peerImage: sellerPhoto,
  });

  return {
    id: sellerId,
    name: sellerName,
    image: sellerPhoto,
    channelType: channel.channelType,
    channelId: channel.channelId,
    cid: channel.cid,
    draftMessage,
  };
}
