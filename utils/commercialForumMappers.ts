import type { ForumPostResponseDto } from '@/services/forumApi';
import type {
  CommercialForumPostDetail,
  CommercialForumPostListItem,
} from '@/types/forumCommercial';
import { FORUM_PARTNER_STORE_POST_TYPE } from '@/types/forumCommercial';

function mapStoreAuthor(
  store: CommercialForumPostListItem['store'] | CommercialForumPostDetail['store'],
  fallbackStore?: { id: string; storeName: string; photoUrl?: string | null },
) {
  const storeId = store?.id?.trim() || fallbackStore?.id?.trim() || '';
  const storeName = store?.storeName?.trim() || fallbackStore?.storeName?.trim() || 'Minha loja';
  const photoUrl = store?.photoUrl?.trim() || fallbackStore?.photoUrl?.trim() || null;
  return { storeId, storeName, photoUrl };
}

function mapPromotedCoupon(
  coupon: CommercialForumPostListItem['coupon'] | CommercialForumPostDetail['coupon'],
) {
  if (!coupon) return null;
  return {
    id: coupon.id,
    name: coupon.name,
    code: coupon.code,
    discountPercent: coupon.discountPercent,
  };
}

export function commercialForumItemToPost(
  item: CommercialForumPostListItem,
  fallbackStore?: { id: string; storeName: string; photoUrl?: string | null },
): ForumPostResponseDto {
  const { storeId, storeName, photoUrl } = mapStoreAuthor(item.store, fallbackStore);

  return {
    id: item.forumPostId,
    hostId: '',
    userId: null,
    title: item.title,
    content: item.content ?? '',
    postType: FORUM_PARTNER_STORE_POST_TYPE,
    likesCount: item.likesCount,
    liked: item.liked ?? false,
    commentsCount: item.commentsCount,
    locationDescription: item.locationDescription ?? null,
    mediaId: item.mediaId ?? null,
    communityId: null,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
    authorCommercial: storeId
      ? { id: storeId, storeName, photoUrl }
      : storeName
        ? { id: storeId || 'store', storeName, photoUrl }
        : undefined,
    promotedCoupon: mapPromotedCoupon(item.coupon),
  };
}

export function commercialForumDetailToPost(
  detail: CommercialForumPostDetail,
  fallbackStore?: { id: string; storeName: string; photoUrl?: string | null },
): ForumPostResponseDto {
  const { storeId, storeName, photoUrl } = mapStoreAuthor(detail.store, fallbackStore);

  return {
    id: detail.forumPostId,
    hostId: detail.hostId,
    userId: null,
    title: detail.title,
    content: detail.content,
    postType: detail.postType || FORUM_PARTNER_STORE_POST_TYPE,
    likesCount: detail.likesCount,
    liked: false,
    commentsCount: detail.commentsCount,
    locationDescription: detail.locationDescription ?? null,
    mediaId: detail.mediaId ?? null,
    communityId: null,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    authorCommercial: storeId
      ? { id: storeId, storeName, photoUrl }
      : { id: storeId || 'store', storeName, photoUrl },
    promotedCoupon: mapPromotedCoupon(detail.coupon),
  };
}
