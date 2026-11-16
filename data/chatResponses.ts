/**
 * Configuração de respostas automáticas e opções interativas para cada conversa.
 * Textos vêm de `@/constants/chatCopy`.
 */

import { chatCopy } from '@/constants/chatCopy';
import { formatCpf } from '@/utils/cpf';

const f = chatCopy.flows;
const m = chatCopy.mock;

export type ChatFlowKind =
  | 'cpf-then-final'
  | 'cpf-then-schedule'
  | 'cpf-then-description-then-final'
  | 'info-only';

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
  flowKind?: ChatFlowKind;
  afterCpfPrompt?: string;
  buildFinalMessage?: (ctx: {
    name: string;
    cpf: string;
    specialty?: string;
    ubs?: string;
    date?: string;
    time?: string;
    description?: string;
    protocol: string;
  }) => string;
};

export type ChatResponseConfig = {
  providerId: string;
  initialMessage: string;
  initialOptions?: ChatOption[];
  freeTextReply?: string;
  responses: Record<string, { message: string; options?: ChatOption[] }>;
};

export const END_SERVICE_OPTION_ID = 'encerrar-atendimento';

export function endServiceOption(): ChatOption {
  return {
    id: END_SERVICE_OPTION_ID,
    label: m.endServiceLabel,
    emoji: '🔚',
    response: m.endServiceResponse,
  };
}

export function endServiceUiOptions(): { id: string; label: string; emoji?: string }[] {
  const opt = endServiceOption();
  return [{ id: opt.id, label: opt.label, emoji: opt.emoji }];
}

export const chatResponseConfigs: Record<string, ChatResponseConfig> = {
  'defesa-civil': {
    providerId: 'defesa-civil',
    initialMessage: f.defesaCivil.initialMessage,
    initialOptions: [
      {
        id: 'reportar-emergencia',
        emoji: '🚨',
        label: f.defesaCivil.reportarEmergencia.label,
        response: f.defesaCivil.reportarEmergencia.response,
        followUpMessage: f.defesaCivil.reportarEmergencia.followUpMessage,
        afterCpfPrompt: f.defesaCivil.reportarEmergencia.afterCpfPrompt,
        processingMessage: f.defesaCivil.reportarEmergencia.processingMessage,
        flowKind: 'cpf-then-description-then-final',
        waitForUserInput: true,
        buildFinalMessage: ({ name, description, protocol }) =>
          f.defesaCivil.reportarEmergencia.finalMessage(name, protocol) +
          (description ? `\n\nRelato: ${description}` : ''),
      },
      {
        id: 'ver-alertas',
        emoji: '🌩️',
        label: f.defesaCivil.verAlertas.label,
        response: f.defesaCivil.verAlertas.response,
        followUpMessage: f.defesaCivil.verAlertas.followUpMessage,
        flowKind: 'cpf-then-final',
        waitForUserInput: true,
        processingMessage: m.cpfChecking,
        buildFinalMessage: ({ name }) => f.defesaCivil.verAlertas.finalMessage(name),
      },
      {
        id: 'areas-risco',
        emoji: '📍',
        label: f.defesaCivil.areasRisco.label,
        response: f.defesaCivil.areasRisco.response,
        followUpMessage: f.defesaCivil.areasRisco.followUpMessage,
        flowKind: 'cpf-then-final',
        waitForUserInput: true,
        processingMessage: m.cpfChecking,
        buildFinalMessage: ({ name }) => f.defesaCivil.areasRisco.finalMessage(name),
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
        processingMessage: f.saude.agendarConsulta.processingMessage,
        flowKind: 'cpf-then-schedule',
        waitForUserInput: true,
        buildFinalMessage: ({ name, specialty, ubs, date, time, protocol }) =>
          f.saude.agendarConsulta.finalMessage(
            name,
            specialty || 'Geral',
            ubs || 'UBS',
            date || 'a combinar',
            time || 'a combinar',
            protocol,
          ),
      },
      {
        id: 'confirmar-consulta',
        emoji: '✅',
        label: f.saude.confirmarConsulta.label,
        response: f.saude.confirmarConsulta.response,
        followUpMessage: f.saude.confirmarConsulta.followUpMessage,
        flowKind: 'cpf-then-final',
        waitForUserInput: true,
        processingMessage: m.cpfChecking,
        buildFinalMessage: ({ name, protocol }) =>
          f.saude.confirmarConsulta.finalMessage(name, protocol),
      },
      {
        id: 'calendario-vacinas',
        emoji: '💉',
        label: f.saude.vacinas.label,
        response: f.saude.vacinas.response,
        followUpMessage: f.saude.vacinas.followUpMessage,
        flowKind: 'cpf-then-final',
        waitForUserInput: true,
        processingMessage: m.cpfChecking,
        buildFinalMessage: ({ name }) => f.saude.vacinas.finalMessage(name),
      },
      {
        id: 'resultado-exames',
        emoji: '🧪',
        label: f.saude.exames.label,
        response: f.saude.exames.response,
        followUpMessage: f.saude.exames.followUpMessage,
        flowKind: 'cpf-then-final',
        waitForUserInput: true,
        processingMessage: m.cpfChecking,
        buildFinalMessage: ({ name, protocol }) => f.saude.exames.finalMessage(name, protocol),
      },
    ],
    responses: {},
  },
  'comunicados-oficiais': {
    providerId: 'comunicados-oficiais',
    initialMessage: f.comunicados.initialMessage,
    freeTextReply: f.comunicados.freeTextReply,
    initialOptions: [
      {
        id: 'gerar-guia-iptu',
        emoji: '🧾',
        label: f.comunicados.gerarGuiaIptu.label,
        response: f.comunicados.gerarGuiaIptu.response,
        followUpMessage: f.comunicados.gerarGuiaIptu.followUpMessage,
        afterCpfPrompt: f.comunicados.gerarGuiaIptu.afterCpfPrompt,
        processingMessage: f.comunicados.gerarGuiaIptu.processingMessage,
        flowKind: 'cpf-then-description-then-final',
        waitForUserInput: true,
        buildFinalMessage: ({ name, cpf, description, protocol }) =>
          f.comunicados.gerarGuiaIptu.finalMessage(
            name,
            description?.trim() || 'Inscrição não informada',
            protocol,
            formatCpf(cpf),
          ),
      },
      {
        id: 'com-iptu-2026',
        emoji: '🏛️',
        label: f.comunicados.iptu2026.label,
        response: f.comunicados.iptu2026.response,
        followUpMessage: f.comunicados.iptu2026.followUpMessage,
        flowKind: 'info-only',
      },
      {
        id: 'com-obras-centro',
        emoji: '🚧',
        label: f.comunicados.obrasCentro.label,
        response: f.comunicados.obrasCentro.response,
        followUpMessage: f.comunicados.obrasCentro.followUpMessage,
        flowKind: 'info-only',
      },
      {
        id: 'com-vacinacao',
        emoji: '💉',
        label: f.comunicados.vacinacao.label,
        response: f.comunicados.vacinacao.response,
        followUpMessage: f.comunicados.vacinacao.followUpMessage,
        flowKind: 'info-only',
      },
    ],
    responses: {},
  },
  iptu: {
    providerId: 'iptu',
    initialMessage: f.iptu.initialMessage,
    initialOptions: [
      {
        id: 'pagar-iptu',
        emoji: '💰',
        label: f.iptu.pagar.label,
        response: f.iptu.pagar.response,
        followUpMessage:
          'Informe o CPF do titular cadastrado no ROTA (apenas números).',
        afterCpfPrompt:
          'CPF confirmado. Informe a inscrição do imóvel (número do carnê) ou o bairro para localizarmos o lançamento.',
        processingMessage: f.iptu.pagar.processingMessage,
        flowKind: 'cpf-then-description-then-final',
        waitForUserInput: true,
      },
      {
        id: 'consultar-debito',
        emoji: '💳',
        label: f.iptu.consultarDebito.label,
        response: f.iptu.consultarDebito.response,
        followUpMessage:
          'Informe o CPF do titular cadastrado no ROTA (apenas números).',
        afterCpfPrompt:
          'CPF confirmado. Informe a inscrição do imóvel ou uma referência para consultar o débito.',
        processingMessage: f.iptu.consultarDebito.processingMessage,
        flowKind: 'cpf-then-description-then-final',
        waitForUserInput: true,
      },
      {
        id: 'segunda-via-boleto',
        emoji: '📄',
        label: f.iptu.segundaVia.label,
        response: f.iptu.segundaVia.response,
        followUpMessage:
          'Informe o CPF do titular cadastrado no ROTA (apenas números).',
        afterCpfPrompt:
          'CPF confirmado. Informe a inscrição do imóvel para emitir a referência da segunda via.',
        processingMessage: f.iptu.segundaVia.processingMessage,
        flowKind: 'cpf-then-description-then-final',
        waitForUserInput: true,
      },
      {
        id: 'descontos-parcelamento',
        emoji: '📉',
        label: f.iptu.descontos.label,
        response: f.iptu.descontos.response,
        followUpMessage: f.iptu.descontos.followUpMessage,
        flowKind: 'info-only',
      },
      {
        id: 'isencao-duvidas',
        emoji: '🏠',
        label: f.iptu.isencao.label,
        response: f.iptu.isencao.response,
        followUpMessage: f.iptu.isencao.followUpMessage,
        flowKind: 'info-only',
      },
    ],
    responses: {},
  },
};

export function getChatResponseConfig(providerId: string): ChatResponseConfig | undefined {
  return chatResponseConfigs[providerId];
}

export function makeFlowProtocol(prefix: string): string {
  const stamp = Date.now().toString().slice(-8);
  return `${prefix}-${stamp}`;
}
