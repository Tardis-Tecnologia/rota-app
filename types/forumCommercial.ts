/** postType das publicações de loja parceira no fórum cidadão. */
export const FORUM_PARTNER_STORE_POST_TYPE = 'partner_store';

export type ForumAuthorCommercial = {
  id: string;
  storeName: string;
  photoUrl: string | null;
};

export type ForumPromotedCoupon = {
  id: string;
  name: string;
  code: string;
  discountPercent: number;
};

export type CommercialMetrics = {
  contactsTotal: number;
  contactsLast7Days: number;
  contactsLast30Days: number;
  forumPostsTotal: number;
  forumEngagementTotal: number;
  couponUsagesTotal: number;
};

export type CommercialForumPostListItem = {
  id: string;
  forumPostId: string;
  title: string;
  content?: string;
  likesCount: number;
  liked?: boolean;
  commentsCount: number;
  locationDescription?: string | null;
  mediaId?: string | null;
  createdAt: string;
  store?: {
    id?: string;
    storeName: string;
    photoUrl?: string | null;
  };
  coupon?: {
    id: string;
    name: string;
    code: string;
    discountPercent: number;
  } | null;
};

export type CommercialForumPostDetail = {
  id: string;
  forumPostId: string;
  hostId: string;
  title: string;
  content: string;
  postType: string;
  likesCount: number;
  commentsCount: number;
  locationDescription?: string | null;
  mediaId?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  store: {
    id?: string;
    storeName: string;
    photoUrl?: string | null;
  };
  coupon?: {
    id: string;
    name: string;
    code: string;
    discountPercent: number;
  } | null;
};
