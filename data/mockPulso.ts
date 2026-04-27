export type Neighborhood = { id: string; name: string };

export type PulseCategoryKey =
  | 'seguranca'
  | 'limpeza'
  | 'transito'
  | 'iluminacao'
  | 'areas_verdes';

export type PulseCategory = {
  key: PulseCategoryKey;
  label: string;
  note: number; 
};

export type PulseTrend = {
  key: PulseCategoryKey;
  label: string;
  delta: number;
};

export type PulseProblem = {
  id: string;
  label: string;
  reports: number;
};

export const NEIGHBORHOODS: Neighborhood[] = [
  { id: 'centro', name: 'Centro' },
  { id: 'itaipuacu', name: 'Itaipuaçu' },
  { id: 'barra', name: 'Barra de Maricá' },
  { id: 'inoa', name: 'Inoã' },
  { id: 'corderinho', name: 'Cordeirinho' },
];

export const PULSE_INDEX_BY_NEIGHBORHOOD: Record<string, number> = {
  centro: 0.6,
  itaipuacu: 0.66,
  barra: 0.62,
  inoa: 0.58,
  cordeirinho: 0.63,
};

export const PULSE_CATEGORIES: PulseCategory[] = [
  { key: 'seguranca', label: 'Segurança', note: 2.8 },
  { key: 'limpeza', label: 'Limpeza', note: 3.1 },
  { key: 'transito', label: 'Trânsito', note: 2.6 },
  { key: 'iluminacao', label: 'Iluminação', note: 3.0 },
  { key: 'areas_verdes', label: 'Áreas Verdes', note: 3.4 },
];

export const PULSE_TRENDS: PulseTrend[] = [
  { key: 'seguranca', label: 'Segurança', delta: -0.2 },
  { key: 'limpeza', label: 'Limpeza', delta: 0.1 },
  { key: 'transito', label: 'Trânsito', delta: -0.3 },
  { key: 'iluminacao', label: 'Iluminação', delta: 0.3 },
  { key: 'areas_verdes', label: 'Áreas Verdes', delta: 0.2 },
];

export const PULSE_PROBLEMS: PulseProblem[] = [
  { id: 'p1', label: 'Iluminação pública precária', reports: 18 },
  { id: 'p2', label: 'Buracos e asfalto irregular', reports: 14 },
  { id: 'p3', label: 'Acúmulo de lixo em vias', reports: 11 },
];

