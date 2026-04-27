import type { Ionicons } from '@expo/vector-icons';

export type MissionCategory = 'Todas' | 'Ambiente' | 'Participação' | 'Social' | 'Saúde';
export type MissionDifficulty = 'Fácil' | 'Médio' | 'Difícil';
export type MissionStatus = 'idle' | 'active' | 'approved';

export type MissionProgress =
  | { kind: 'percent'; current: number; total: number }
  | { kind: 'participants'; current: number; total: number; percent: number };

export type Mission = {
  id: string;
  title: string;
  description: string;
  category: Exclude<MissionCategory, 'Todas'>;
  points: number;
  difficulty: MissionDifficulty;
  status: MissionStatus;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  topAccent: string;
  tagBg: string;
  tagText: string;
  progress?: MissionProgress;
};

export type RankingEntry = {
  id: string;
  name: string;
  points: number;
};

export const missionCategories: MissionCategory[] = ['Todas', 'Ambiente', 'Participação', 'Social', 'Saúde'];

export const mockMissions: Mission[] = [
  {
    id: 'plantar-arvore',
    title: 'Plante uma Árvore',
    description:
      'Plante uma muda no seu bairro e registre como comprovação. Ajude a deixar a cidade mais verde!',
    category: 'Ambiente',
    points: 300,
    difficulty: 'Médio',
    status: 'approved',
    icon: 'leaf-outline',
    iconBg: '#10B981',
    topAccent: '#10B981',
    tagBg: '#D1FAE5',
    tagText: '#047857',
    progress: { kind: 'percent', current: 1, total: 1 },
  },
  {
    id: 'audiencia-publica',
    title: 'Participe da Audiência Pública',
    description: 'Compareça à próxima audiência pública sobre o plano diretor e registre sua participação.',
    category: 'Participação',
    points: 200,
    difficulty: 'Fácil',
    status: 'active',
    icon: 'people-outline',
    iconBg: '#0EA5E9',
    topAccent: '#06B6D4',
    tagBg: '#CFFAFE',
    tagText: '#0E7490',
    progress: { kind: 'percent', current: 0, total: 1 },
  },
  {
    id: 'reportar-buraco',
    title: 'Reporte um Buraco',
    description: 'Ajude a prefeitura: registre um buraco na rua e envie o relato com localização aproximada.',
    category: 'Social',
    points: 250,
    difficulty: 'Médio',
    status: 'idle',
    icon: 'megaphone-outline',
    iconBg: '#7C3AED',
    topAccent: '#8B5CF6',
    tagBg: '#EDE9FE',
    tagText: '#6D28D9',
  },
  {
    id: 'doar-sangue',
    title: 'Doe Sangue',
    description: 'Doe sangue em um centro de doação e registre sua participação.',
    category: 'Saúde',
    points: 180,
    difficulty: 'Fácil',
    status: 'idle',
    icon: 'heart-outline',
    iconBg: '#EF4444',
    topAccent: '#F43F5E',
    tagBg: '#FEE2E2',
    tagText: '#B91C1C',
  },
  {
    id: 'mutirao-limpeza',
    title: 'Participe do Mutirão de Limpeza',
    description: 'Junte-se ao mutirão de limpeza no parque central neste sábado às 8h.',
    category: 'Social',
    points: 150,
    difficulty: 'Fácil',
    status: 'approved',
    icon: 'trash-outline',
    iconBg: '#F59E0B',
    topAccent: '#F97316',
    tagBg: '#EDE9FE',
    tagText: '#6D28D9',
    progress: { kind: 'participants', current: 89, total: 300, percent: 30 },
  },
];

export const mockRankingEntries: RankingEntry[] = [
  { id: 'aline', name: 'Aline', points: 520 },
  { id: 'voce', name: 'Você', points: 450 },
  { id: 'joao', name: 'João', points: 410 },
  { id: 'mariana', name: 'Mariana', points: 360 },
  { id: 'rafa', name: 'Rafa', points: 180 },
];

