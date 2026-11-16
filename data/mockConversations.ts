import { Conversation } from '@/contexts/ConversationsContext';

/** Chat fixo no topo da caixa de mensagens do cidadão. */
export const mockFixedConversations: Conversation[] = [
  {
    id: 'fixed-comunicados-oficiais',
    providerId: 'comunicados-oficiais',
    providerName: 'Comunicados Oficiais',
    providerImage: '',
    lastMessage: 'Leia avisos ou gere a guia de IPTU 2026.',
    unreadCount: 1,
    date: ' ',
    providerData: {
      id: 'comunicados-oficiais',
      name: 'Comunicados Oficiais',
      image: '',
    },
  },
];

export const mockSystemConversations: Conversation[] = [
  {
    id: 'system-saude',
    providerId: 'saude',
    providerName: 'Secretaria de Saúde',
    providerImage: 'https://i.pravatar.cc/150?u=saude',
    lastMessage: 'Olá! Meu nome é Ana Paula. Como posso ajudar?',
    date: '2d atrás',
    providerData: {
      id: 'saude',
      name: 'Secretaria de Saúde',
      image: 'https://i.pravatar.cc/150?u=saude',
    },
  },
  {
    id: 'system-defesa-civil',
    providerId: 'defesa-civil',
    providerName: 'Defesa Civil',
    providerImage: 'https://i.pravatar.cc/150?u=defesa-civil',
    lastMessage: 'Olá! Meu nome é Roberto. Como posso ajudar?',
    date: '5d atrás',
    providerData: {
      id: 'defesa-civil',
      name: 'Defesa Civil',
      image: 'https://i.pravatar.cc/150?u=defesa-civil',
    },
  },
];
