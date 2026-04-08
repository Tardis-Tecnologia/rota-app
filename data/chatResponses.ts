/**
 * Configuração de respostas automáticas e opções interativas para cada conversa.
 * Textos vêm de `@/constants/chatCopy`.
 */

import { chatCopy } from '@/constants/chatCopy';

const f = chatCopy.flows;
const c = chatCopy.channels;
const a = chatCopy.attendant;

export type ChatOption = {
  id: string;
  label: string;
  emoji?: string;
  response: string;
  followUpMessage?: string;
  showOptionsAfter?: boolean;
  waitForUserInput?: boolean;
  processingMessage?: string;
  finalMessage?: string;
  handoffToAgent?: boolean;
  handoffChannelName?: string;
  secondStepPrompt?: string;
  handoffAfterSecondStep?: boolean;
  handoffAfterFirstInput?: boolean;
};

/** Última opção em cada lista: transferência para atendente */
export function agentHandoffOption(handoffChannelName: string): ChatOption {
  return {
    id: a.optionId,
    label: a.label,
    emoji: a.emoji,
    response: a.userResponse,
    followUpMessage: '',
    handoffToAgent: true,
    handoffChannelName,
  };
}

export type ChatResponseConfig = {
  providerId: string;
  initialMessage: string;
  initialOptions?: ChatOption[];
  responses: Record<
    string,
    {
      message: string;
      options?: ChatOption[];
    }
  >;
};

export const chatResponseConfigs: Record<string, ChatResponseConfig> = {
  'defesa-civil': {
    providerId: 'defesa-civil',
    initialMessage: f.defesaCivil.initialMessage,
    initialOptions: [
      {
        id: 'reportar-emergencia',
        emoji: '🚨',
        ...f.defesaCivil.reportarEmergencia,
        waitForUserInput: true,
        showOptionsAfter: true,
      },
      {
        id: 'ver-alertas',
        emoji: '🌩️',
        ...f.defesaCivil.verAlertas,
        showOptionsAfter: true,
      },
      {
        id: 'areas-risco',
        emoji: '📍',
        ...f.defesaCivil.areasRisco,
        showOptionsAfter: true,
      },
    ],
    responses: {},
  },
  saude: {
    providerId: 'saude',
    initialMessage: f.saude.initialMessage,
    initialOptions: [
      {
        id: 'agendar-consulta',
        emoji: '📅',
        label: f.saude.agendarConsulta.label,
        response: f.saude.agendarConsulta.response,
        followUpMessage: f.saude.agendarConsulta.followUpMessage,
        waitForUserInput: true,
        secondStepPrompt: f.saude.agendarConsulta.secondStepPrompt,
        handoffAfterSecondStep: true,
        handoffChannelName: c.saudeAgendamento,
      },
      {
        id: 'Confirmar consulta',
        emoji: '✅',
        label: f.saude.confirmarConsulta.label,
        response: f.saude.confirmarConsulta.response,
        followUpMessage: f.saude.confirmarConsulta.followUpMessage,
        waitForUserInput: true,
        handoffAfterFirstInput: true,
        handoffChannelName: c.saudeConfirmar,
      },
      {
        id: 'Informações sobre vacinas',
        emoji: '💉',
        label: f.saude.vacinas.label,
        response: f.saude.vacinas.response,
        followUpMessage: f.saude.vacinas.followUpMessage,
        showOptionsAfter: true,
      },
      agentHandoffOption(c.saude),
    ],
    responses: {},
  },
  'comunicados-oficiais': {
    providerId: 'comunicados-oficiais',
    initialMessage: f.comunicados.initialMessage,
    initialOptions: [],
    responses: {},
  },
  iptu: {
    providerId: 'iptu',
    initialMessage: f.iptu.initialMessage,
    initialOptions: [
      {
        id: 'pagar-iptu',
        emoji: '💰',
        ...f.iptu.pagar,
        waitForUserInput: true,
        showOptionsAfter: true,
      },
      {
        id: 'consultar-debito',
        emoji: '💳',
        ...f.iptu.consultarDebito,
        waitForUserInput: true,
        showOptionsAfter: true,
      },
      {
        id: 'segunda-via-boleto',
        emoji: '📄',
        ...f.iptu.segundaVia,
        waitForUserInput: true,
        showOptionsAfter: true,
      },
      {
        id: 'descontos-parcelamento',
        emoji: '📉',
        label: f.iptu.descontos.label,
        response: f.iptu.descontos.response,
        followUpMessage: f.iptu.descontos.followUpMessage,
        showOptionsAfter: true,
      },
      {
        id: 'isenção-duvidas',
        emoji: '🏠',
        label: f.iptu.isencao.label,
        response: f.iptu.isencao.response,
        followUpMessage: f.iptu.isencao.followUpMessage,
        showOptionsAfter: true,
      },
      agentHandoffOption(c.iptu),
    ],
    responses: {},
  },
};

export function getChatResponseConfig(providerId: string): ChatResponseConfig | undefined {
  return chatResponseConfigs[providerId];
}
