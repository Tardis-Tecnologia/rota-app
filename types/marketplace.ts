export type MarketplaceCategoryId =
  | 'eletronicos'
  | 'moveis'
  | 'veiculos'
  | 'moda'
  | 'casa'
  | 'esportes'
  | 'outros';

export type MarketplaceListFilter = MarketplaceCategoryId | 'todos';

export interface MarketplaceSeller {
  id: string;
  name: string;
  photoUrl: string | null;
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhotoUrl?: string | null;
  /** Anúncio de conta comercial (loja) vs cidadão */
  sellerIsCommercial?: boolean;
  title: string;
  description: string;
  category: string;
  /** Valor em reais (API envia string "450.00") */
  price: number;
  locationName: string;
  locationAddress: string | null;
  advertiserContact: string;
  imageUri: string | null;
  imageId: string | null;
  /** Galeria completa (capa + extras), URLs públicas */
  imageUris: string[];
  /** IDs das fotos extras (sem a capa) */
  galleryImageIds: string[];
  isOwner: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListingInput {
  title: string;
  description: string;
  category: string;
  price: number;
  advertiserContact: string;
  locationName: string;
  locationAddress?: string;
  imageUri?: string | null;
  imageId?: string | null;
  /** Fotos na ordem da galeria (capa = primeira) */
  images?: Array<{ uri: string; id?: string | null }>;
}

export interface MarketplaceSellerDto {
  id?: string;
  name?: string | null;
  photoUrl?: string | null;
}

export interface MarketplaceListingListItemDto {
  id: string;
  title: string;
  category: string;
  price: string;
  imagePublicUrl?: string | null;
  locationName?: string | null;
  seller?: MarketplaceSellerDto | null;
  status?: string;
  description?: string | null;
}

export interface MarketplaceListingDetailDto extends MarketplaceListingListItemDto {
  locationAddress?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  advertiserContact?: string | null;
  image?: { id: string; publicUrl: string | null; path?: string } | null;
  galleryImageIds?: string[];
  galleryImages?: Array<{ id: string; publicUrl: string | null; path?: string }>;
  isOwner?: boolean;
  commercialAccountId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMarketplaceListingBody {
  hostId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  imageId?: string;
  galleryImageIds?: string[];
  advertiserContact: string;
  locationName: string;
  locationAddress?: string;
  status?: 'draft' | 'published';
}
