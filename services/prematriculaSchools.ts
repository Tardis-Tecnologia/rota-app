export type PrematriculaLevel = 'creche' | 'fundamental' | 'medio';

export type PrematriculaSchool = {
  id: string;
  level: PrematriculaLevel;
  name: string;
  address: string;
  region: string;
  typeLabel: string;
  badgeColor: string;
  badgeBackground: string;
  imageUrl: string;
  vacanciesAvailable: number;
  waitlist: number;
  shifts: string[];
  description: string;
};

export const PREMATRICULA_LEVELS: {
  id: PrematriculaLevel;
  title: string;
  description: string;
  icon: 'happy-outline' | 'school-outline' | 'book-outline';
}[] = [
  {
    id: 'creche',
    title: 'Creche',
    description: 'Para crianças de 0 a 3 anos',
    icon: 'happy-outline',
  },
  {
    id: 'fundamental',
    title: 'Ensino Fundamental',
    description: 'Do 1º ao 9º ano',
    icon: 'school-outline',
  },
  {
    id: 'medio',
    title: 'Ensino Médio',
    description: 'Do 1º ao 3º ano',
    icon: 'book-outline',
  },
];

export const prematriculaSchools: PrematriculaSchool[] = [
  {
    id: 'esc5',
    level: 'creche',
    name: 'Creche Municipal Pipa no Céu',
    address: 'Rua das Acácias, 120 — São José do Imbassaí',
    region: 'São José do Imbassaí',
    typeLabel: 'Municipal',
    badgeColor: '#2563eb',
    badgeBackground: '#dbeafe',
    imageUrl:
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&auto=format&fit=crop&q=60',
    vacanciesAvailable: 1,
    waitlist: 6,
    shifts: ['Integral'],
    description: 'Atendimento em período integral com berçário e maternal.',
  },
  {
    id: 'esc6',
    level: 'creche',
    name: 'Creche Comunitária Sonho de Criança',
    address: 'Travessa da Amizade, 55 — Centro',
    region: 'Centro',
    typeLabel: 'Comunitária',
    badgeColor: '#7c3aed',
    badgeBackground: '#ede9fe',
    imageUrl:
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&auto=format&fit=crop&q=60',
    vacanciesAvailable: 0,
    waitlist: 14,
    shifts: ['Integral', 'Manhã'],
    description: 'Parceria comunitária com vagas em lista de espera.',
  },
  {
    id: 'sim-creche-sj',
    level: 'creche',
    name: 'Creche Municipal São José',
    address: 'Rua das Acácias — São José do Imbassaí',
    region: 'São José do Imbassaí',
    typeLabel: 'Municipal',
    badgeColor: '#2563eb',
    badgeBackground: '#dbeafe',
    imageUrl:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&auto=format&fit=crop&q=60',
    vacanciesAvailable: 1,
    waitlist: 14,
    shifts: ['Integral'],
    description: 'Unidade de referência para educação infantil na região.',
  },
  {
    id: 'esc2',
    level: 'fundamental',
    name: 'EM Professor Benedito Odilon',
    address: 'Rua Álvares de Castro — Centro, Maricá',
    region: 'Centro',
    typeLabel: 'Municipal',
    badgeColor: '#2563eb',
    badgeBackground: '#dbeafe',
    imageUrl:
      'https://images.unsplash.com/photo-1562774053-701939374585?w=400&auto=format&fit=crop&q=60',
    vacanciesAvailable: 6,
    waitlist: 2,
    shifts: ['Manhã', 'Tarde'],
    description: 'Ensino fundamental completo com vagas no 1º e 5º ano.',
  },
  {
    id: 'esc4',
    level: 'fundamental',
    name: 'EM Itaipuaçu',
    address: 'Estrada de Itaipuaçu — Maricá',
    region: 'Itaipuaçu',
    typeLabel: 'Municipal',
    badgeColor: '#2563eb',
    badgeBackground: '#dbeafe',
    imageUrl:
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=60',
    vacanciesAvailable: 15,
    waitlist: 1,
    shifts: ['Manhã', 'Tarde'],
    description: 'Unidade com boa oferta de vagas no fundamental.',
  },
  {
    id: 'esc-medio-1',
    level: 'medio',
    name: 'CIE Inoã',
    address: 'Avenida Central — Inoã, Maricá',
    region: 'Inoã',
    typeLabel: 'Municipal',
    badgeColor: '#0d9488',
    badgeBackground: '#ccfbf1',
    imageUrl:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&auto=format&fit=crop&q=60',
    vacanciesAvailable: 9,
    waitlist: 3,
    shifts: ['Manhã'],
    description: 'Centro Integrado de Educação com ensino médio.',
  },
  {
    id: 'esc-medio-2',
    level: 'medio',
    name: 'EM Professora Maria da Glória',
    address: 'Rua do Comércio — Centro, Maricá',
    region: 'Centro',
    typeLabel: 'Municipal',
    badgeColor: '#0d9488',
    badgeBackground: '#ccfbf1',
    imageUrl:
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&auto=format&fit=crop&q=60',
    vacanciesAvailable: 4,
    waitlist: 5,
    shifts: ['Manhã', 'Noite'],
    description: 'Ensino médio regular e EJA noturno.',
  },
];

export function getPrematriculaSchoolsByLevel(level: PrematriculaLevel): PrematriculaSchool[] {
  return prematriculaSchools.filter((s) => s.level === level);
}

export function getPrematriculaSchoolById(id: string): PrematriculaSchool | undefined {
  return prematriculaSchools.find((s) => s.id === id);
}

export function prematriculaLevelTitle(level: string): string {
  return PREMATRICULA_LEVELS.find((l) => l.id === level)?.title ?? 'Escolas';
}
