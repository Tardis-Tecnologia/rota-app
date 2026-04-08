/** Sincronizar `stream.waitForAgentMessage` com `HANDOFF_WAIT_MESSAGE_NORMALIZED` em `rota-back/stream-chat/stream-chat.service.ts`. */
export const chatCopy = {
  stream: {
    waitForAgentMessage:
      'Obrigado pelo contato. Em breve retornamos nesta conversa.',
  },

  errors: {
    handoffGeneric:
      'Não foi possível abrir o atendimento. Tente novamente mais tarde ou confirme a configuração do servidor.',
    sessionRequiredForAttendant: 'É necessário iniciar sessão para falar com um atendente.',
    invalidChatServerResponse: 'Resposta inválida do servidor de chat.',
    noSession: 'Sem sessão',
    noUser: 'Sem usuário',
    streamTokenFailed: (status: number) => `Token Stream falhou (${status})`,
    sessionRequired: 'É necessário iniciar sessão.',
    deleteConversationFailed: 'Não foi possível eliminar a conversa.',
    handoffOpenFailedFallback: 'Não foi possível abrir o atendimento. Tente novamente mais tarde.',
  },

  handoff: {
    connectingAttendant: 'A conectar ao atendente…',
    openingConversation: 'A abrir conversa com o atendimento…',
  },

  mock: {
    processingDefault: 'Processando...',
    finalDefault: 'Pronto! Posso ajudar com mais alguma coisa?',
    specialtyRegistered: 'Especialidade registrada.',
  },

  fallbackInitialMessage: (providerName: string) =>
    `Olá! Você iniciou uma conversa com ${providerName}. Como posso ajudar hoje?`,

  channels: {
    saude: 'Atendimento — Saúde',
    saudeAgendamento: 'Atendimento — Saúde (agendamento)',
    saudeConfirmar: 'Atendimento — Saúde (confirmar consulta)',
    iptu: 'Atendimento — IPTU',
  },

  attendant: {
    optionId: 'falar-com-atendente',
    label: 'Falar com atendente',
    emoji: '👤',
    userResponse: 'Quero falar com um atendente',
  },

  screen: {
    deleteConversationTitle: 'Eliminar conversa',
    deleteConversationMessage: 'A conversa deixa de aparecer na sua lista. Deseja continuar?',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    errorTitle: 'Erro',
    deleteConversationError: 'Não foi possível eliminar a conversa.',
    inputPlaceholder: 'Digite sua mensagem...',
    online: 'Online',
    offline: 'Offline',
    deleteConversationA11y: 'Eliminar conversa',
  },

  flows: {
    defesaCivil: {
      initialMessage: 'Olá! Meu nome é Roberto. Como posso ajudar?',
      reportarEmergencia: {
        label: 'Reportar emergência',
        response: 'Reportar emergência',
        followUpMessage:
          'Entendi que você precisa reportar uma emergência. Por favor, descreva a situação e sua localização.',
        processingMessage: 'Obrigado pela informação! Estou processando sua solicitação...',
        finalMessage:
          'Registei o seu relato. Em situação de risco imediato, ligue 199 ou 193. Posso ajudar com mais alguma coisa?',
      },
      verAlertas: {
        label: 'Ver alertas de clima',
        response: 'Ver alertas de clima',
        followUpMessage:
          '🌧️ Alerta ativo: previsão de chuva forte para as próximas horas. Evite áreas de alagamento e siga orientações da Defesa Civil.',
      },
      areasRisco: {
        label: 'Áreas de risco',
        response: 'Áreas de risco',
        followUpMessage:
          'Consulte o mapa de áreas de risco no site da Prefeitura ou no app Rota. Em caso de dúvida, procure um ponto de apoio indicado pela Defesa Civil.',
      },
    },
    saude: {
      initialMessage: 'Olá! Meu nome é Ana Paula. Como posso ajudar?',
      agendarConsulta: {
        label: 'Agendar consulta',
        response: 'Agendar consulta',
        followUpMessage:
          'Vou ajudar você a agendar uma consulta. Qual especialidade você precisa?',
        secondStepPrompt: 'Informe o CPF (apenas números).',
      },
      confirmarConsulta: {
        label: 'Confirmar consulta',
        response: 'Confirmar consulta',
        followUpMessage: 'Para confirmar a consulta, informe o CPF (apenas números).',
      },
      vacinas: {
        label: 'Informações sobre vacinas',
        response: 'Informações sobre vacinas',
        followUpMessage: 'Entendi. Estou verificando isso para você. Um momento…',
      },
    },
    comunicados: {
      initialMessage: 'Notificação de IPTU 2025\nRecebida em 02/12/2025 às 10:35',
    },
    iptu: {
      initialMessage:
        'Olá, sou o assistente virtual do IPTU.\n\nPosso orientar sobre pagamento, débitos, segunda via, descontos e parcelamento. O que você precisa?',
      pagar: {
        label: 'Pagar IPTU',
        response: 'Quero pagar o IPTU',
        followUpMessage:
          'Para localizar o seu carnê, informe o número da inscrição do imóvel (na conta do IPTU) ou o seu CPF (somente números).',
        processingMessage: 'A consultar os dados…',
        finalMessage:
          'Situação (simulação)\n\n• Exercício em aberto com valor à vista com desconto até a data do carnê.\n• Você pode pagar à vista (com desconto, se ainda vigente) ou parcelar conforme o carnê.\n\nDica: guarde o comprovante após o pagamento. Posso ajudar com mais alguma coisa?',
      },
      consultarDebito: {
        label: 'Consultar débito',
        response: 'Quero consultar débito de IPTU',
        followUpMessage:
          'Informe o número de inscrição do imóvel ou o CPF do proprietário para eu simular a consulta.',
        processingMessage: 'A verificar débitos…',
        finalMessage:
          'Resumo (simulação)\n\n• IPTU em dia até o exercício anterior.\n• Há parcela(s) referentes ao exercício atual em aberto, se aplicável.\n\nPara valores exatos e vencimentos, use o carnê oficial ou o portal da Prefeitura. Quer segunda via ou ajuda com pagamento?',
      },
      segundaVia: {
        label: 'Segunda via do boleto',
        response: 'Preciso da segunda via do boleto',
        followUpMessage:
          'Informe a inscrição do imóvel ou o CPF para gerarmos a referência da segunda via (simulação).',
        processingMessage: 'A processar o pedido…',
        finalMessage:
          'Segunda via (simulação)\n\n• Na prática, o boleto seria emitido no portal ou no balcão do IPTU.\n• Confira se o vencimento ainda está dentro do prazo para desconto.\n\nPosso ajudar com outro assunto do IPTU?',
      },
      descontos: {
        label: 'Descontos e parcelamento',
        response: 'Quero saber sobre desconto e parcelas',
        followUpMessage:
          'Orientação geral\n\n• Quem paga à vista dentro do prazo costuma ter desconto (conforme legislação e calendário do exercício).\n• O parcelamento segue as opções do carnê (quantidade de parcelas e datas).\n• IPTU atrasado pode ter multa e juros — regularize o quanto antes.\n\nPara o seu caso específico, use a opção Consultar débito ou Pagar IPTU e informe CPF/inscrição.',
      },
      isencao: {
        label: 'Isenção e imóvel isento',
        response: 'Dúvida sobre isenção',
        followUpMessage:
          'Isenção\n\n• Depende de critérios legais (idade, renda, tipo de imóvel, uso, etc.).\n• É necessário protocolar pedido e apresentar documentação na Secretaria responsável, quando houver edital ou processo aberto.\n\nNeste chat não é feita análise real de isenção — procure o setor de IPTU ou o canal oficial da Prefeitura.',
      },
    },
  },
} as const;
