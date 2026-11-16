import { chatCopy } from '@/constants/chatCopy';
import { makeFlowProtocol } from '@/data/chatResponses';
import { briefDelay } from '@/services/chatHealthSchedule';
import { getEmergencyAlerts } from '@/services/emergencyAlertApi';
import {
  APPOINTMENT_STATUS_LABELS,
  formatSlotDateTime,
  getMyAppointments,
  getMyExamResults,
} from '@/services/healthApi';
import { getNews } from '@/services/newsApi';
import { formatCpf } from '@/utils/cpf';

const f = chatCopy.flows;

export type ChatServiceContext = {
  optionId: string;
  name: string;
  cpf: string;
  description?: string;
};

function protocolFor(optionId: string): string {
  if (optionId.includes('iptu') || optionId.includes('guia')) return makeFlowProtocol('IPT');
  if (optionId.includes('emergencia') || optionId.includes('risco') || optionId.includes('alerta')) {
    return makeFlowProtocol('DC');
  }
  if (optionId.includes('exame')) return makeFlowProtocol('EXA');
  if (optionId.includes('consulta') || optionId.includes('vacina')) return makeFlowProtocol('SAU');
  return makeFlowProtocol('ROT');
}

async function resolveConfirmAppointment(name: string): Promise<string> {
  const list = await getMyAppointments();
  const upcoming = list
    .filter((a) => a.status === 'SCHEDULED' && new Date(a.startsAt).getTime() > Date.now())
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  if (!upcoming.length) {
    return `Não encontrei consulta agendada para ${name}.\n\nUse Agendar consulta para marcar um horário. O histórico completo fica em Saúde → Meus agendamentos.`;
  }
  const next = upcoming[0];
  const extras =
    upcoming.length > 1
      ? `\n\nHá mais ${upcoming.length - 1} consulta(s) futura(s). Veja todas em Saúde → Meus agendamentos.`
      : '\n\nDetalhes também em Saúde → Meus agendamentos.';
  return (
    `Consulta localizada.\n\n` +
    `• Paciente: ${name}\n` +
    `• Status: ${APPOINTMENT_STATUS_LABELS[next.status]}\n` +
    `• Especialidade: ${next.specialty}\n` +
    `• Unidade: ${next.unit.name}\n` +
    `• Quando: ${formatSlotDateTime(next.startsAt)}\n` +
    `• Protocolo: ${next.id.slice(0, 8).toUpperCase()}` +
    extras
  );
}

async function resolveExamResults(name: string): Promise<string> {
  const results = await getMyExamResults();
  if (!results.length) {
    return `Não há resultados de exames disponíveis para ${name} no momento.\n\nQuando o laboratório liberar, eles aparecem em Saúde → Exames.`;
  }
  const lines = results.slice(0, 5).map((item, index) => {
    const place = item.unit?.name ? ` — ${item.unit.name}` : '';
    const date = new Date(item.resultDate).toLocaleDateString('pt-BR');
    return `• ${item.examName}${place}\n  Liberado em ${date}${item.viewedAt ? '' : ' (novo)'}`;
  });
  const more =
    results.length > 5 ? `\n\n…e mais ${results.length - 5}. Abra Saúde → Exames.` : '';
  return `Resultados disponíveis — ${name}:\n\n${lines.join('\n\n')}${more}`;
}

async function resolveAlerts(name: string): Promise<string> {
  const alerts = await getEmergencyAlerts({ init: 0, end: 8 });
  if (!alerts.length) {
    return (
      `Nenhum alerta ativo para Maricá no momento (conta de ${name}).\n\n` +
      `Em risco imediato, ligue 199 ou 193.`
    );
  }
  const lines = alerts.slice(0, 5).map((alert) => {
    const level = alert.level ? ` [${alert.level}]` : '';
    const body = alert.description?.trim() ? `\n  ${alert.description.trim()}` : '';
    return `• ${alert.title}${level}${body}`;
  });
  return `Alertas para Maricá (conta de ${name}):\n\n${lines.join('\n\n')}\n\nFonte: Defesa Civil municipal.`;
}

async function resolveOfficialNotice(optionId: string, fallback: string): Promise<string> {
  try {
    const news = await getNews({ status: 'published', init: 0, end: 20 });
    const keywords =
      optionId === 'com-iptu-2026'
        ? ['iptu', 'tribut']
        : optionId === 'com-obras-centro'
          ? ['obra', 'centro', 'rua']
          : optionId === 'com-vacinacao'
            ? ['vacin', 'influenza', 'saúde', 'saude']
            : [];
    const match = news.find((item) => {
      const hay = `${item.title} ${item.content ?? ''} ${(item.tags ?? []).join(' ')}`.toLowerCase();
      return keywords.some((k) => hay.includes(k));
    });
    const pick = match ?? news.find((item) => item.creatorOfficial) ?? news[0];
    if (!pick) return fallback;
    const excerpt = (pick.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 280);
    return (
      `Comunicado oficial — ${pick.title}\n\n` +
      (excerpt ? `${excerpt}${excerpt.length >= 280 ? '…' : ''}\n\n` : '') +
      `Publicado no canal de novidades do ROTA.`
    );
  } catch {
    return fallback;
  }
}

function resolveIptuGuide(ctx: ChatServiceContext): string {
  const protocol = protocolFor(ctx.optionId);
  const imovel = ctx.description?.trim() || 'Inscrição não informada';
  return f.comunicados.gerarGuiaIptu.finalMessage(
    ctx.name,
    imovel,
    protocol,
    formatCpf(ctx.cpf),
  );
}

function resolveIptuStatus(ctx: ChatServiceContext): string {
  const protocol = protocolFor(ctx.optionId);
  const ref = ctx.description?.trim() || formatCpf(ctx.cpf);
  if (ctx.optionId === 'pagar-iptu') {
    return (
      `Situação do IPTU\n\n` +
      `• Titular: ${ctx.name}\n` +
      `• Ref.: ${ref}\n` +
      `• Protocolo: ${protocol}\n` +
      `• Exercício em aberto com valor à vista com desconto até a data do carnê.\n` +
      `• Você pode pagar à vista (com desconto, se ainda vigente) ou parcelar conforme o carnê.\n\n` +
      `Guarde o comprovante após o pagamento. A guia completa fica no portal da Fazenda.`
    );
  }
  if (ctx.optionId === 'consultar-debito') {
    return (
      `Resumo do IPTU\n\n` +
      `• Titular: ${ctx.name}\n` +
      `• Ref.: ${ref}\n` +
      `• Protocolo: ${protocol}\n` +
      `• IPTU em dia até o exercício anterior.\n` +
      `• Há parcela(s) do exercício atual em aberto, se aplicável ao seu imóvel.\n\n` +
      `Para valores e vencimentos exatos, use o carnê oficial ou o portal da Prefeitura.`
    );
  }
  if (ctx.optionId === 'segunda-via-boleto') {
    return (
      `Segunda via disponível\n\n` +
      `• Titular: ${ctx.name}\n` +
      `• Ref.: ${ref}\n` +
      `• Protocolo: ${protocol}\n` +
      `• O boleto pode ser emitido no portal ou no balcão do IPTU.\n` +
      `• Confira se o vencimento ainda está dentro do prazo para desconto.`
    );
  }
  return chatCopy.mock.finalDefault;
}

/** Resolve o texto final de cada opção do chat (API real quando existir). */
export async function resolveChatServiceResult(ctx: ChatServiceContext): Promise<string> {
  const { optionId, name, description } = ctx;
  const protocol = protocolFor(optionId);

  switch (optionId) {
    case 'confirmar-consulta':
      return resolveConfirmAppointment(name);
    case 'resultado-exames':
      return resolveExamResults(name);
    case 'calendario-vacinas':
      await briefDelay(400);
      return f.saude.vacinas.finalMessage(name);
    case 'ver-alertas':
      return resolveAlerts(name);
    case 'areas-risco':
      await briefDelay(400);
      return f.defesaCivil.areasRisco.finalMessage(name);
    case 'reportar-emergencia':
      await briefDelay(450);
      return (
        f.defesaCivil.reportarEmergencia.finalMessage(name, protocol) +
        (description ? `\n\nRelato: ${description}` : '')
      );
    case 'gerar-guia-iptu':
      await briefDelay(500);
      return resolveIptuGuide(ctx);
    case 'pagar-iptu':
    case 'consultar-debito':
    case 'segunda-via-boleto':
      await briefDelay(500);
      return resolveIptuStatus(ctx);
    case 'com-iptu-2026':
      return resolveOfficialNotice(optionId, f.comunicados.iptu2026.followUpMessage);
    case 'com-obras-centro':
      return resolveOfficialNotice(optionId, f.comunicados.obrasCentro.followUpMessage);
    case 'com-vacinacao':
      return resolveOfficialNotice(optionId, f.comunicados.vacinacao.followUpMessage);
    case 'descontos-parcelamento':
      await briefDelay(350);
      return f.iptu.descontos.followUpMessage;
    case 'isencao-duvidas':
      await briefDelay(350);
      return f.iptu.isencao.followUpMessage;
    default:
      await briefDelay(350);
      return chatCopy.mock.finalDefault;
  }
}

export function loadingLabelForOption(optionId: string): string {
  switch (optionId) {
    case 'confirmar-consulta':
      return 'Consultando seus agendamentos…';
    case 'resultado-exames':
      return 'Buscando resultados de exames…';
    case 'calendario-vacinas':
      return 'Consultando carteira vacinal…';
    case 'ver-alertas':
      return 'Carregando alertas da Defesa Civil…';
    case 'areas-risco':
      return 'Consultando áreas de atenção…';
    case 'reportar-emergencia':
      return 'Registrando ocorrência na Defesa Civil…';
    case 'gerar-guia-iptu':
    case 'pagar-iptu':
      return 'Gerando informações do IPTU…';
    case 'consultar-debito':
      return 'Verificando débitos…';
    case 'segunda-via-boleto':
      return 'Preparando segunda via…';
    case 'com-iptu-2026':
    case 'com-obras-centro':
    case 'com-vacinacao':
      return 'Buscando comunicado oficial…';
    case 'descontos-parcelamento':
    case 'isencao-duvidas':
      return 'Carregando orientação…';
    default:
      return chatCopy.mock.processingDefault;
  }
}
