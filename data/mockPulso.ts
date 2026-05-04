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
  delta: number | null;
};

export type PulseProblem = {
  id: string;
  label: string;
  reports: number;
};
