import type {
  MarketplaceListing,
  MarketplaceListingDetailDto,
  MarketplaceListingListItemDto,
} from '@/types/marketplace';
import { parseMarketplacePriceValue } from '@/utils/marketplaceFormat';

/** Aceita array direto ou envelope Spring ({ content }, { items }, etc.). */
export function parseMarketplaceListPayload(raw: unknown): MarketplaceListingListItemDto[] {
  if (Array.isArray(raw)) {
    return raw as MarketplaceListingListItemDto[];
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const key of ['content', 'items', 'data', 'listings', 'results']) {
      const value = o[key];
      if (Array.isArray(value)) {
        return value as MarketplaceListingListItemDto[];
      }
    }
  }
  return [];
}

function readListingId(dto: MarketplaceListingListItemDto): string {
  const r = dto as MarketplaceListingListItemDto & { listingId?: string };
  return String(dto.id ?? r.listingId ?? '').trim();
}

function mapSeller(dto: MarketplaceListingListItemDto): {
  sellerId: string;
  sellerName: string;
  sellerPhotoUrl: string | null;
} {
  const sellerId = dto.seller?.id?.trim() || '';
  const sellerName = dto.seller?.name?.trim() || 'Loja';
  const sellerPhotoUrl = dto.seller?.photoUrl?.trim() || null;
  return { sellerId, sellerName, sellerPhotoUrl };
}

export function mapMarketplaceListItem(dto: MarketplaceListingListItemDto): MarketplaceListing | null {
  const id = readListingId(dto);
  if (!id) return null;

  const { sellerId, sellerName, sellerPhotoUrl } = mapSeller(dto);
  const detail = dto as MarketplaceListingDetailDto;
  const imageUri =
    dto.imagePublicUrl?.trim() ||
    detail.image?.publicUrl?.trim() ||
    null;
  const imageId = detail.image?.id?.trim() || null;
  const galleryFromDto =
    detail.galleryImages
      ?.map((img) => img.publicUrl?.trim() || '')
      .filter(Boolean) ?? [];
  const imageUris =
    galleryFromDto.length > 0
      ? galleryFromDto
      : imageUri
        ? [imageUri]
        : [];
  const galleryImageIds = (detail.galleryImageIds ?? [])
    .map((id) => String(id).trim())
    .filter(Boolean);
  const priceRaw =
    dto.price ??
    (detail as MarketplaceListingDetailDto & { priceValue?: string | number }).priceValue;

  return {
    id,
    sellerId,
    sellerName,
    sellerPhotoUrl,
    title: dto.title,
    description: dto.description?.trim() || '',
    category: dto.category,
    price: parseMarketplacePriceValue(priceRaw ?? 0),
    locationName: dto.locationName?.trim() || '',
    locationAddress: null,
    advertiserContact: '',
    imageUri,
    imageId,
    imageUris,
    galleryImageIds,
    isOwner: false,
    status: dto.status?.trim() || 'published',
    createdAt: '',
    updatedAt: '',
  };
}

export function mapMarketplaceDetail(dto: MarketplaceListingDetailDto): MarketplaceListing {
  const base = mapMarketplaceListItem(dto);
  if (!base) {
    throw new Error('Resposta de anúncio inválida.');
  }
  const commercialAccountId = dto.commercialAccountId?.trim() || '';
  const userId = dto.userId?.trim() || '';
  const sellerId = base.sellerId || commercialAccountId || userId || '';
  return {
    ...base,
    sellerId,
    sellerIsCommercial: !!commercialAccountId || (!userId && !!sellerId),
    description: dto.description?.trim() || base.description,
    locationAddress: dto.locationAddress?.trim() || null,
    advertiserContact: dto.advertiserContact?.trim() || '',
    imageUri: dto.image?.publicUrl?.trim() || dto.imagePublicUrl?.trim() || base.imageUri,
    imageId: dto.image?.id?.trim() || base.imageId,
    imageUris:
      (dto.galleryImages ?? [])
        .map((img) => img.publicUrl?.trim() || '')
        .filter(Boolean).length > 0
        ? (dto.galleryImages ?? [])
            .map((img) => img.publicUrl?.trim() || '')
            .filter(Boolean)
        : base.imageUris,
    galleryImageIds: (dto.galleryImageIds ?? base.galleryImageIds)
      .map((id) => String(id).trim())
      .filter(Boolean),
    isOwner: dto.isOwner === true,
    createdAt: dto.createdAt?.trim() || '',
    updatedAt: dto.updatedAt?.trim() || '',
  };
}
