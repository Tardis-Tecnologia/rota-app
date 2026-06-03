import type { FeedFilter } from '@/types';

export type FeedNovidadeCategoria = Exclude<FeedFilter, 'todos'>;

export type FeedNovidadeTipo = 'comunicado' | 'alerta' | 'atualizacao' | 'evento' | 'aviso';

export interface FeedNovidade {
  id: string;
  /** host do comunicado — necessário para listar comentários quando o JWT não traz hostId */
  hostId?: string | null;
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
  curtidas: number;
  liked: boolean;
  comentarios: number;
}
