export type FeedFilter = 'todos' | 'noticias' | 'obras' | 'lazer';

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

export interface PontoInteresse {
  id: string;
  titulo: string;
  descricao: string;
  latitude: number;
  longitude: number;
  tipo: 'governo' | 'saude' | 'lazer' | 'educacao' | 'cultura' | 'turismo';
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  photoUrl?: string;
  formattedAddress?: string;
  telefone?: string;
  placeType?: string;
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
  name: string;
  categoryId: string;
  rating: number;
  image: string;
  review: number;
  about: string;
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

export type RewardsFilterTab =
  | 'resgatar'
  | 'ganhar'
  | 'historico';

export const FILTER_CHIPS: { key: RewardsFilterTab; label: string }[] = [
  { key: 'resgatar', label: 'Resgatar recompensas' },
  { key: 'ganhar', label: 'Ganhe pontos' },
  { key: 'historico', label: 'Histórico' },
];