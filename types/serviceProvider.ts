export type ServiceProviderType = 'INDIVIDUAL' | 'COMPANY';

export type ServiceProviderStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface CreateServiceProviderBody {
  hostId: string;
  type: ServiceProviderType;
  cnpj: string;
  name: string;
  category: string;
  phone: string;
  description?: string;
  email?: string;
  whatsapp?: string;
  cep?: string;
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  imageId?: string;
  businessHours?: Record<string, unknown> | string;
}

/** Campos editáveis pelo dono do prestador (PATCH parcial). */
export interface ServiceProviderOwnerUpdateBody {
  name?: string;
  category?: string;
  description?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  cep?: string;
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  imageId?: string;
  businessHours?: Record<string, unknown>;
}

/** Superadmin: pode incluir type e hostId; CNPJ continua fora do body. */
export type ServiceProviderSuperAdminUpdateBody = ServiceProviderOwnerUpdateBody & {
  type?: ServiceProviderType;
  hostId?: string;
};

export type UpdateServiceProviderBody =
  | ServiceProviderOwnerUpdateBody
  | ServiceProviderSuperAdminUpdateBody;

export interface ServiceProviderListItem {
  id: string;
  hostId: string;
  type: ServiceProviderType;
  name: string;
  category: string;
  cnpj: string;
  status: ServiceProviderStatus;
  imagePublicUrl?: string | null;
  ratingAverage: string;
  ratingCount: number;
  locationName?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  distanceKm?: number | null;
}

export interface ServiceProviderResponse {
  id: string;
  hostId: string;
  userId: string;
  type: ServiceProviderType;
  name: string;
  category: string;
  cnpj: string;
  status: ServiceProviderStatus;
  cnpjLegalName?: string | null;
  cnpjTradeName?: string | null;
  cnpjSituation?: string | null;
  phone: string;
  email?: string | null;
  whatsapp?: string | null;
  description?: string | null;
  imageId?: string | null;
  imagePublicUrl?: string | null;
  cep?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  businessHours?: Record<string, unknown> | string | null;
  ratingAverage: string;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
}
