export type CargoPrestadorId =
  | 'encanador'
  | 'eletricista'
  | 'jardineiro'
  | 'pintor'
  | 'diarista';

export type CategoriaEmpresaId = 'food' | 'business' | 'servicos' | 'saude' | 'educacao';

export interface CargoPrestador {
  id: CargoPrestadorId;
  label: string;
}

export interface CategoriaEmpresa {
  id: CategoriaEmpresaId;
  label: string;
}

/** Cargos para filtro de PRESTADORES (profissões) */
export const CARGOS_PRESTADORES: CargoPrestador[] = [
  { id: 'encanador', label: 'Encanador' },
  { id: 'eletricista', label: 'Eletricista' },
  { id: 'jardineiro', label: 'Jardineiro' },
  { id: 'pintor', label: 'Pintor' },
  { id: 'diarista', label: 'Diarista' },
];

/** Categorias para filtro de EMPRESAS */
export const CATEGORIAS_EMPRESAS: CategoriaEmpresa[] = [
  { id: 'food', label: 'Alimentação' },
  { id: 'business', label: 'Negócios' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'saude', label: 'Saúde' },
  { id: 'educacao', label: 'Educação' },
];

/** Lista completa de cargos (inclui "Todos" para uso em listagens) */
export const CATEGORIES_WITH_ALL: { id: string; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  ...CARGOS_PRESTADORES,
];
