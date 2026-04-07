import { Conversation } from '@/contexts/ConversationsContext';

/**
 * Dados mockados de conversas iniciais do sistema
 * Este arquivo centraliza todas as conversas e mensagens mockadas para facilitar manutenção
 */

// Chats fixos que sempre aparecem no topo
export const mockFixedConversations: Conversation[] = [
  {
    id: 'fixed-comunicados-oficiais',
    providerId: 'comunicados-oficiais',
    providerName: 'Comunicados Oficiais',
    providerImage: '',
    lastMessage: 'Aviso oficial — toque para ler a mensagem completa.',
    unreadCount: 1,
    date: ' ',
    providerData: {
      id: 'comunicados-oficiais',
      name: 'Comunicados Oficiais',
      image: '',
    },
  },
];

// Conversas do sistema normais
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

