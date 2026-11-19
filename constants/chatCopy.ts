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
    clearConversationFailed: 'Não foi possível limpar a conversa.',
    handoffOpenFailedFallback: 'Não foi possível abrir o atendimento. Tente novamente mais tarde.',
  },

  handoff: {
    connectingAttendant: 'A conectar ao atendente…',
    openingConversation: 'A abrir conversa com o atendimento…',
  },

  mock: {
    processingDefault: 'Processando...',
    finalDefault: 'Pronto! Se precisar de outra coisa, encerre o atendimento e escolha uma nova opção.',
    specialtyRegistered: 'Especialidade registrada.',
    cpfPrompt: 'Informe o CPF do titular cadastrado no ROTA (apenas números).',
    cpfChecking: 'Validando CPF e conferindo o cadastro…',
    endedService: 'Atendimento encerrado. Como posso ajudar?',
    endServiceLabel: 'Encerrar atendimento',
    endServiceResponse: 'Quero encerrar o atendimento',
    pickSpecialty: 'Escolha a especialidade:',
    pickUbs: 'CPF confirmado. Escolha a UBS:',
    pickDate: 'Escolha a data disponível:',
    pickTime: 'Escolha o horário:',
    loadingUnits: 'Buscando unidades…',
    loadingSpecialties: 'Carregando especialidades…',
    loadingAgenda: 'Consultando agenda…',
    loadingTimes: 'Carregando horários…',
    loadingBook: 'Confirmando agendamento…',
    loadingGeneric: 'Consultando…',
  },

  fallbackInitialMessage: (providerName: string) =>
    `Olá! Você iniciou uma conversa com ${providerName}. Como posso ajudar hoje?`,

  channels: {
    saude: 'Atendimento — Saúde',
    saudeAgendamento: 'Atendimento — Saúde (agendamento)',
    saudeConfirmar: 'Atendimento — Saúde (confirmar consulta)',
    defesaCivil: 'Atendimento — Defesa Civil',
    iptu: 'Atendimento — IPTU',
    comunicados: 'Atendimento — Comunicados Oficiais',
  },

  attendant: {
    optionId: 'falar-com-atendente',
    label: 'Falar com atendente',
    emoji: '👤',
    userResponse: 'Quero falar com um atendente',
  },

  screen: {
    clearConversationTitle: 'Limpar conversa',
    clearConversationMessage:
      'As mensagens serão apagadas, mas a conversa continuará no histórico. Deseja continuar?',
    cancel: 'Cancelar',
    clear: 'Limpar',
    errorTitle: 'Erro',
    clearConversationError: 'Não foi possível limpar a conversa.',
    inputPlaceholder: 'Digite sua mensagem...',
    online: 'Online',
    offline: 'Offline',
    clearConversationA11y: 'Limpar conversa',
  },

  flows: {
    defesaCivil: {
      initialMessage:
        'Olá! Sou o assistente da Defesa Civil de Maricá.\n\nPara qualquer solicitação, primeiro valido o seu CPF no cadastro do ROTA. Como posso ajudar?',
      reportarEmergencia: {
        label: 'Reportar ocorrência',
        response: 'Quero reportar uma ocorrência',
        followUpMessage:
          'Antes de registrar, informe o CPF do titular cadastrado no ROTA (apenas números).',
        afterCpfPrompt:
          'CPF confirmado. Descreva a ocorrência com local aproximado (rua/bairro) e o que está acontecendo.',
        processingMessage: 'Registrando ocorrência na Defesa Civil…',
        finalMessage: (name: string, protocol: string) =>
          `Ocorrência registrada.\n\n• Protocolo: ${protocol}\n• Solicitante: ${name}\n• Situação: recebida pela Defesa Civil\n\nEm risco imediato à vida, ligue 199 ou 193 agora.`,
      },
      verAlertas: {
        label: 'Ver alertas ativos',
        response: 'Quero ver alertas ativos',
        followUpMessage:
          'Para liberar os alertas do seu município, informe o CPF cadastrado no ROTA (apenas números).',
        finalMessage: (name: string) =>
          `Alertas para Maricá (conta de ${name}):\n\n• Chuva moderada a forte — próximas 12h\n• Evite áreas de alagamento e encostas\n• Pontos de apoio: Centro e Itaipuaçu\n\nFonte: Defesa Civil municipal.`,
      },
      areasRisco: {
        label: 'Consultar áreas de risco',
        response: 'Quero consultar áreas de risco',
        followUpMessage:
          'Informe o CPF cadastrado no ROTA para liberar o mapa de risco do município (apenas números).',
        finalMessage: (name: string) =>
          `Áreas de atenção em Maricá (${name}):\n\n• Encostas em Inoã e São José do Imbassaí\n• Baixadas com histórico de alagamento no Centro\n• Faixa litorânea em mar agitado\n\nEm dúvida, procure um ponto de apoio da Defesa Civil.`,
      },
    },
    saude: {
      initialMessage:
        'Olá! Sou Ana Paula, da Secretaria de Saúde.\n\nAtendimentos pelo ROTA começam pela validação do CPF no seu cadastro. O que você precisa?',
      agendarConsulta: {
        label: 'Agendar consulta',
        response: 'Quero agendar uma consulta',
        followUpMessage:
          'Informe o CPF do paciente cadastrado no ROTA (apenas números).',
        processingMessage: 'Confirmando vaga na agenda…',
        finalMessage: (
          name: string,
          specialty: string,
          ubs: string,
          date: string,
          time: string,
          protocol: string,
        ) =>
          `Consulta agendada.\n\n• Protocolo: ${protocol}\n• Paciente: ${name}\n• Especialidade: ${specialty}\n• UBS: ${ubs}\n• Data: ${date}\n• Horário: ${time}\n\nCompareça 15 min antes com documento. O agendamento já aparece em Saúde → Meus agendamentos.`,
      },
      confirmarConsulta: {
        label: 'Confirmar consulta',
        response: 'Quero confirmar uma consulta',
        followUpMessage:
          'Informe o CPF do paciente cadastrado no ROTA (apenas números).',
        finalMessage: (name: string, protocol: string) =>
          `Consulta localizada.\n\n• Paciente: ${name}\n• Status: confirmada\n• Protocolo: ${protocol}\n• Unidade: UBS Centro — compareça 15 min antes com documento\n\nPara remarcar, encerre o atendimento e use Agendar consulta.`,
      },
      vacinas: {
        label: 'Calendário de vacinas',
        response: 'Quero informações sobre vacinas',
        followUpMessage:
          'Informe o CPF cadastrado no ROTA para consultar a carteira vacinal (apenas números).',
        finalMessage: (name: string) =>
          `Carteira vacinal — ${name}:\n\n• Influenza 2026: em dia\n• COVID (reforço): disponível nas UBS\n• Hepatite B: esquema completo\n\nLeve documento com foto na unidade.`,
      },
      exames: {
        label: 'Resultado de exames',
        response: 'Quero ver resultado de exames',
        followUpMessage:
          'Informe o CPF do paciente cadastrado no ROTA (apenas números).',
        finalMessage: (name: string, protocol: string) =>
          `Resultados disponíveis — ${name}:\n\n• Hemograma — pronto para retirada\n• Protocolo: ${protocol}\n• Local: laboratório da UBS Centro\n\nLeve documento com foto.`,
      },
    },
    comunicados: {
      initialMessage:
        'Comunicados Oficiais da Prefeitura de Maricá.\n\nLeia um aviso ou gere a guia do IPTU 2026. Para a guia, validamos o CPF do titular no cadastro ROTA.\n\nVocê também pode escrever uma pergunta ou relatar um problema. Essa resposta usa os registros do seu município.',
      iptu2026: {
        label: 'IPTU 2026 — calendário',
        response: 'Quero ler o comunicado de IPTU 2026',
        followUpMessage:
          'Comunicado oficial — IPTU 2026\n\nO carnê do exercício 2026 já está disponível. Quem preferir pode gerar a guia de pagamento por aqui (opção Gerar guia de IPTU), com validação do CPF cadastrado no ROTA.',
      },
      obrasCentro: {
        label: 'Obras no Centro',
        response: 'Quero ler o comunicado de obras',
        followUpMessage:
          'Comunicado oficial — Obras no Centro\n\nTrechos da Rua Principal terão intervenção de 08h às 17h nos próximos dias. Haverá desvio sinalizado. Comerciantes e moradores devem evitar estacionar na faixa de obras.\n\nAcompanhe atualizações neste canal.',
      },
      vacinacao: {
        label: 'Campanha de vacinação',
        response: 'Quero ler o comunicado de vacinação',
        followUpMessage:
          'Comunicado oficial — Campanha de vacinação\n\nAs UBS de Maricá ampliaram o horário de vacinação contra influenza aos sábados pela manhã. Leve documento com foto e cartão de vacina, se tiver.\n\nMais detalhes na Secretaria de Saúde.',
      },
      gerarGuiaIptu: {
        label: 'Gerar guia de IPTU',
        response: 'Quero gerar a guia de IPTU',
        followUpMessage:
          'Para emitir a guia do IPTU 2026, informe o CPF do titular cadastrado no ROTA (apenas números).',
        afterCpfPrompt:
          'CPF confirmado. Informe a inscrição do imóvel (número do carnê) ou digite o bairro para localizarmos o lançamento.',
        processingMessage: 'Gerando guia de IPTU 2026…',
        finalMessage: (name: string, imovel: string, protocol: string, cpfFormatted: string) =>
          `Guia de IPTU 2026 gerada.\n\n• Protocolo: ${protocol}\n• Titular: ${name}\n• CPF: ${cpfFormatted}\n• Imóvel/ref.: ${imovel}\n• Exercício: 2026\n• Valor à vista: R$ 1.284,70\n• Vencimento: 10/04/2026\n• Linha digitável: 8569.00001 23456.789012 34567.890123 4 98650000128470\n\nGuarde o protocolo. A guia completa também fica disponível no portal da Fazenda.`,
      },
      freeTextReply:
        'Recebi sua mensagem nos Comunicados Oficiais. Escolha um aviso acima ou use Gerar guia de IPTU para emitir a guia com o CPF cadastrado. Em emergência, use Defesa Civil ou ligue 199/193.',
    },
    iptu: {
      initialMessage:
        'Olá, sou o assistente virtual do IPTU.\n\nPara pagar, consultar débito ou pedir segunda via, valido o CPF do titular no cadastro ROTA. Também oriento sobre descontos e isenção. O que você precisa?',
      pagar: {
        label: 'Pagar IPTU',
        response: 'Quero pagar o IPTU',
        followUpMessage:
          'Para localizar o seu carnê, informe o número da inscrição do imóvel (na conta do IPTU) ou o seu CPF (somente números).',
        processingMessage: 'A consultar os dados…',
        finalMessage:
          'Situação do IPTU\n\n• Exercício em aberto com valor à vista com desconto até a data do carnê.\n• Você pode pagar à vista (com desconto, se ainda vigente) ou parcelar conforme o carnê.\n\nDica: guarde o comprovante após o pagamento.',
      },
      consultarDebito: {
        label: 'Consultar débito',
        response: 'Quero consultar débito de IPTU',
        followUpMessage:
          'Informe o número de inscrição do imóvel ou o CPF do proprietário para consultar.',
        processingMessage: 'A verificar débitos…',
        finalMessage:
          'Resumo do IPTU\n\n• IPTU em dia até o exercício anterior.\n• Há parcela(s) referentes ao exercício atual em aberto, se aplicável.\n\nPara valores exatos e vencimentos, use o carnê oficial ou o portal da Prefeitura.',
      },
      segundaVia: {
        label: 'Segunda via do boleto',
        response: 'Preciso da segunda via do boleto',
        followUpMessage:
          'Informe a inscrição do imóvel ou o CPF para emitir a referência da segunda via.',
        processingMessage: 'A processar o pedido…',
        finalMessage:
          'Segunda via disponível\n\n• O boleto pode ser emitido no portal ou no balcão do IPTU.\n• Confira se o vencimento ainda está dentro do prazo para desconto.',
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
