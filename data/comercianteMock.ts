export const COMERCIANTE_HEADER_STATS = {
  cupons: 0,
  uso: 2,
  contatos: 9,
} as const;

export const COMERCIANTE_METRICS = {
  cuponsAtivosHoje: 0,
  engajamento: 18,
} as const;

export type ComercianteNotificacao = {
  id: string;
  nome: string;
  acao: string;
  tempo: string;
  avatar: string;
};

export const COMERCIANTE_NOTIFICACOES: ComercianteNotificacao[] = [
  {
    id: '1',
    nome: 'Mariana Costa',
    acao: 'usou o cupom BANHO20',
    tempo: 'agora • Centro',
    avatar: 'https://i.pravatar.cc/150?u=mariana-costa',
  },
  {
    id: '2',
    nome: 'Carlos Lima',
    acao: 'resgatou o cupom PET15',
    tempo: 'há 12 min • Copacabana',
    avatar: 'https://i.pravatar.cc/150?u=carlos-lima',
  },
  {
    id: '3',
    nome: 'Ana Souza',
    acao: 'avaliou sua oferta com 5 estrelas',
    tempo: 'há 35 min • Botafogo',
    avatar: 'https://i.pravatar.cc/150?u=ana-souza',
  },
];
