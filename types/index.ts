export type FeedFilter = 'todos' | 'noticias' | 'obras' | 'lazer' | 'enquetes';

export interface Noticia {
  id: string;
  titulo: string;
  resumo: string;
  imagem: string;
  data: string;
  categoria: string;
  conteudo?: string;
  autor?: string;
}

/** Dados do carrossel de eventos (UI) — alinhado ao que o componente renderiza */
export interface Evento {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  local: string;
  imagem?: string;
}

export interface Post {
  id: string;
  autor: string;
  avatar: string;
  data: string;
  conteudo: string;
  imagem: string | null;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  curtido: boolean;
  username?: string; // @pref_cidade
  createdByUserId?: string | null;
  tipo?: 'post' | 'alerta'; // Tipo do post
  titulo?: string; // Para alertas
  categoria: Exclude<FeedFilter, 'todos'>;
}

export interface PlaceReview {
  author: string;
  comment: string;
  rating: number;
  timeAgo?: string;
}

export interface PontoInteresse {
  id: string;
  titulo: string;
  descricao: string;
  latitude: number;
  longitude: number;
  /** Cor do ponto no mapa. Quando ausente, o mapa usa a cor do tipo. */
  markerColor?: string;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  photoUrl?: string;
  /** Galeria do estabelecimento no sheet do mapa (setas se > 1). */
  photoUrls?: string[];
  formattedAddress?: string;
  telefone?: string;
  placeType?: string;
  /** Texto curto / sobre o estabelecimento no sheet do mapa. */
  about?: string;
  reviews?: PlaceReview[];
}

export interface Localizacao {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Região/viewport do mapa (compatível com Localizacao)
export type Region = Localizacao;

// Tipos de perfis de Serviços e Profissionais
export type ProfileType = 'PROVIDER' | 'COMPANY';

export type Service = {
  name: string;
  description: string;
  price: string;
};

export type Review = {
  author: string;
  comment: string;
  rating: number;
};

export type MuralPost = {
  id: string;
  timeAgo: string;
  text: string;
  imageUri?: string;
  likes: number;
};

export type Profile = {
  id: string;
  type: ProfileType;
  /** Dono do perfil (prestador) para chat direto */
  ownerUserId?: string;
  name: string;
  /** Categoria principal (1ª de categoryIds). */
  categoryId: string;
  /** Todas as profissões do prestador (IDs). */
  categoryIds?: string[];
  rating: number;
  image: string;
  review: number;
  about: string;
  /** Coordenadas para mapa e ordenação por proximidade */
  latitude?: number;
  longitude?: number;
  /** Endereço fixo (empresas) ou referência de localização */
  address?: string;
  serviceArea?: string;
  hours?: string;
  phone?: string;
  email?: string;
  services?: Service[];
  reviews: Review[];
  gallery: string[];
  muralPosts?: MuralPost[];
};

export interface CatalogReward {
  id: string;
  name: string;
  description: string;
  value: number;
  disabled?: boolean;
}

export type StoreCouponsListEntry =
  | { kind: 'commercial'; id: string }
  | { kind: 'reward'; id: string };

/** Abas da Loja de Recompensas (UI segmentada). */
export type RewardsFilterTab = 'meus_resgates' | 'cupons_lojas';

export const REWARDS_STORE_TABS: { key: RewardsFilterTab; label: string }[] = [
  { key: 'meus_resgates', label: 'Meus Resgates' },
  { key: 'cupons_lojas', label: 'Cupons de Lojas' },
];