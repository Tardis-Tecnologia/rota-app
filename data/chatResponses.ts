/**
 * Configuração de respostas automáticas e opções interativas para cada conversa
 * Define quais botões aparecem e quais respostas são enviadas automaticamente
 */

export type ChatOption = {
  id: string;
  label: string;
  emoji?: string; // Emoji para o botão e mensagem
  response: string; // Resposta automática quando clicado
  followUpMessage?: string; // Mensagem de follow-up do sistema
  showOptionsAfter?: boolean; // Se deve mostrar opções novamente após resposta
  waitForUserInput?: boolean; // Se deve esperar input do usuário antes de mostrar opções
  processingMessage?: string; // Mensagem de processamento após input do usuário
  finalMessage?: string; // Mensagem final após processamento
};

export type ChatResponseConfig = {
  providerId: string;
  initialMessage: string;
  initialOptions?: ChatOption[];
  responses: Record<string, {
    message: string;
    options?: ChatOption[];
  }>;
};

/**
 * Configurações de respostas para cada conversa do sistema
 */
export const chatResponseConfigs: Record<string, ChatResponseConfig> = {
  'defesa-civil': {
    providerId: 'defesa-civil',
    initialMessage: 'Olá! Meu nome é Roberto. Como posso ajudar?',
    initialOptions: [
      {
        id: 'reportar-emergencia',
        label: 'Reportar emergência',
        emoji: '🚨',
        response: 'Reportar emergência',
        followUpMessage: 'Entendi que você precisa reportar uma emergência. Por favor, descreva a situação e sua localização.',
        waitForUserInput: true,
        processingMessage: 'Obrigado pela informação! Estou processando sua solicitação...',
        finalMessage: 'Pronto! Encontrei as informações. Posso ajudar com mais alguma coisa?',
        showOptionsAfter: true,
      },
      {
        id: 'ver-alertas',
        label: 'Ver alertas de clima',
        emoji: '🌩️',
        response: 'Ver alertas de clima',
        followUpMessage: '🌧️ Alerta Ativo: Previsão de chuva forte para as próximas 2 horas. Evite áreas de alagamento.',
        showOptionsAfter: true,
      },
      {
        id: 'areas-risco',
        label: 'Áreas de risco',
        emoji: '📍',
        response: 'Áreas de risco',
        followUpMessage: 'Entendi! Vou verificar isso para você. Um momento...',
        showOptionsAfter: true,
      },
    ],
    responses: {},
  },
  'saude': {
    providerId: 'saude',
    initialMessage: 'Olá! Meu nome é Ana Paula. Como posso ajudar?',
    initialOptions: [
      {
        id: 'agendar-consulta',
        label: 'Agendar consulta',
        emoji: '📅',
        response: 'Agendar consulta',
        followUpMessage: 'Vou te ajudar a agendar uma consulta! Qual especialidade você precisa?',
        waitForUserInput: true,
        processingMessage: 'Obrigado pela informação! Estou processando sua solicitação...',
        finalMessage: 'Pronto! Encontrei as informações. Posso ajudar com mais alguma coisa?',
        showOptionsAfter: true,
      },
      {
        id: 'Confirmar consulta',
        label: 'Confirmar consulta',
        emoji: '✅',
        response: 'Confirmar consulta',
        followUpMessage: 'Entendi! Vou verificar isso para você. Um momento...',
        showOptionsAfter: false,
      },
      {
        id: 'Informações sobre vacinas',
        label: 'Informações sobre vacinas',
        emoji: '💉',
        response: 'Informações sobre vacinas',
        followUpMessage: 'Entendi! Vou verificar isso para você. Um momento...',
        showOptionsAfter: false,
      },
    ],
    responses: {},
  },
  'comunicados-oficiais': {
    providerId: 'comunicados-oficiais',
    initialMessage: 'Notificação de IPTU 2025\nRecebida em 02/12/2025 às 10:35',
    initialOptions: [],
    responses: {},
  },
  'iptu': {
    providerId: 'iptu',
    initialMessage: 'Olá! Meu nome é Carlos. Como posso ajudar?',
    initialOptions: [
      {
        id: 'pagar-iptu',
        label: 'Pagar IPTU',
        emoji: '💰',
        response: 'Pagar IPTU',
        followUpMessage: 'Para consultar ou pagar seu IPTU, preciso do número da inscrição do imóvel ou seu CPF. Pode me informar?',
        waitForUserInput: true,
        processingMessage: 'Obrigado pela informação! Estou processando sua solicitação...',
        finalMessage: 'Pronto! Encontrei as informações. Posso ajudar com mais alguma coisa?',
        showOptionsAfter: true,
      },
      {
        id: 'consultar-debito',
        label: 'Consultar débito',
        emoji: '💳',
        response: 'Consultar débito',
        followUpMessage: 'Para consultar seu débito de IPTU, preciso do número da inscrição do imóvel ou seu CPF. Pode me informar?',
        waitForUserInput: true,
        processingMessage: 'Obrigado pela informação! Estou processando sua solicitação...',
        finalMessage: 'Pronto! Encontrei as informações. Posso ajudar com mais alguma coisa?',
        showOptionsAfter: true,
      },
      {
        id: 'segunda-via-boleto',
        label: 'Segunda via do boleto',
        emoji: '📄',
        response: 'Segunda via de boleto',
        followUpMessage:'Entendi! Vou verificar isso para você. Um momento...',
        showOptionsAfter: false,
      },
    ],
    responses: {},
  },
};

/**
 * Busca a configuração de respostas para um provider
 */
export function getChatResponseConfig(providerId: string): ChatResponseConfig | undefined {
  return chatResponseConfigs[providerId];
}

