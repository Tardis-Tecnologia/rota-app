import type { FeedFilter } from '@/types';

export type FeedNovidadeCategoria = Exclude<FeedFilter, 'todos'>;

export type FeedNovidadeTipo = 'comunicado' | 'alerta' | 'atualizacao' | 'evento' | 'aviso';

export type FeedPostType = 'article' | 'poll';

export interface FeedPollData {
  id: string;
  options: string[];
  optionCounts: number[];
  userVoted: boolean;
  selectedOptionIndex: number | null;
}

export interface FeedNovidade {
  id: string;
  postType: FeedPostType;
  /** host do comunicado — necessário para comentários/voto quando aplicável */
  hostId?: string | null;
  pollId?: string | null;
  poll?: FeedPollData | null;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem: string | null;
  /** ISO 8601 — usado para ordenação */
  dataPublicacao: string;
  dataRelativa: string;
  dataFormatada: string;
  categoria: FeedNovidadeCategoria;
  categoriaLabel: string;
  tipoNovidade: FeedNovidadeTipo;
  tipoLabel: string;
  autorNome: string;
  autorAvatar: string;
  autorHandle: string;
  /** Perfil do publicador (ex.: SUPERADMIN), quando a API enviar */
  autorPerfil?: string | null;
  curtidas: number;
  liked: boolean;
  comentarios: number;
}

export function isFeedPollItem(item: FeedNovidade): boolean {
  return item.postType === 'poll';
}
