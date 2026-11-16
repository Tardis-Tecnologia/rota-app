import ChatScreen, { ChatMessage, ChatOption, ChatParticipant } from '@/components/ChatScreen';
import { chatCopy } from '@/constants/chatCopy';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/contexts/ConversationsContext';
import {
  END_SERVICE_OPTION_ID,
  endServiceUiOptions,
  getChatResponseConfig,
  makeFlowProtocol,
  type ChatOption as FlowOption,
} from '@/data/chatResponses';
import * as authApi from '@/services/authApi';
import { getApiBaseUrl, getAuthToken, getWhitelabelHostId } from '@/services/authApi';
import { scheduleAppointmentReminder } from '@/services/appointmentReminders';
import { checkCitizenCpfAgainstSession } from '@/services/chatCitizenLookup';
import {
  loadingLabelForOption,
  resolveChatServiceResult,
} from '@/services/chatCitizenServices';
import {
  bookChatAppointment,
  briefDelay,
  loadChatUbsOptions,
  loadSlotsForChat,
  specialtyOptionsForUnit,
  timeOptionsForDay,
} from '@/services/chatHealthSchedule';
import { formatSlotDateTime, type HealthSlot, type HealthUnit } from '@/services/healthApi';
import { isChatPeerUserId, resolveChatPeerPhotoUrl } from '@/services/chatPeerPhotos';
import {
  clearStreamChannelHistory,
  ensureStreamChatConnected,
  markStreamChannelRead,
  streamChatUrl,
} from '@/services/streamChatApi';
import {
  filterMessagesAfterClear,
  getStreamChannelClearedAt,
} from '@/services/streamChatClearStore';
import { getStreamChannelPeer, isSameStreamUser } from '@/utils/streamChatPeer';
import { resolveMessagesInboxRoute } from '@/utils/comercioAuth';
import { streamAndUiDisplayName } from '@/utils/userDisplayName';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { useFocusEffect } from 'expo-router';
import { Alert, AppState } from 'react-native';

const { stream: streamCopy, errors: errCopy, handoff: handoffCopy, mock: mockCopy } = chatCopy;

/** Lê `message` do JSON de erro do Nest (ex.: validação, BadRequest). */
async function parseFailedFetchMessage(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    if (!text.trim()) return fallback;
    const parsed = JSON.parse(text) as { message?: string | string[] };
    const m = parsed.message;
    if (typeof m === 'string' && m.trim()) return m;
    if (Array.isArray(m)) {
      const joined = m.filter((x): x is string => typeof x === 'string').join(' ');
      if (joined.trim()) return joined;
    }
  } catch {
    // corpo não JSON
  }
  return fallback;
}

type HandoffResult =
  | { ok: true; channelType: string; channelId: string; cid: string }
  | { ok: false; message: string };

async function requestSupportHandoff(
  handoffChannelName: string,
  agendamento?: { especialidade: string; cpf: string },
): Promise<HandoffResult> {
  const authToken = getAuthToken();
  if (!authToken) {
    return { ok: false, message: errCopy.sessionRequiredForAttendant };
  }
  const body: Record<string, string> = {
    name: handoffChannelName,
    hostId: getWhitelabelHostId(),
  };
  if (agendamento) {
    body.agendamentoEspecialidade = agendamento.especialidade.slice(0, 200);
    body.agendamentoCpf = agendamento.cpf.replace(/\D/g, '').slice(0, 14);
  }
  const handoffRes = await fetch(`${getApiBaseUrl()}/api/v1/stream-chat/support-handoff`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!handoffRes.ok) {
    return { ok: false, message: await parseFailedFetchMessage(handoffRes, errCopy.handoffGeneric) };
  }
  const { cid } = (await handoffRes.json()) as { cid: string };
  const colonIdx = cid.indexOf(':');
  if (colonIdx <= 0 || colonIdx >= cid.length - 1) {
    return { ok: false, message: errCopy.invalidChatServerResponse };
  }
  return {
    ok: true,
    channelType: cid.slice(0, colonIdx),
    channelId: cid.slice(colonIdx + 1),
    cid,
  };
}

async function postWaitMessage(channelType: string, channelId: string): Promise<void> {
  const authToken = getAuthToken();
  if (!authToken) return;
  try {
    await fetch(
      streamChatUrl(
        `${encodeURIComponent(channelType)}/${encodeURIComponent(channelId)}/messages`,
      ),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          text: streamCopy.waitForAgentMessage,
          fromSupportAgent: true,
        }),
      },
    );
  } catch {
    // ignorar
  }
}

function mapChannelStateToMessages(
  state: { messages?: Array<{ id?: string; text?: string; created_at?: string | Date; user?: { id?: string } | null }> },
  currentUserId: string,
): ChatMessage[] {
  return (state.messages || []).map<ChatMessage>((msg) => ({
    id: msg.id || `${msg.created_at || Date.now()}`,
    text: msg.text || '',
    isFromOther: !isSameStreamUser(msg.user?.id, currentUserId),
    timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
  }));
}

type ChatProviderParam = {
  id: string;
  name: string;
  image?: string;
  channelId?: string;
  channelType?: string;
  cid?: string;
  draftMessage?: string;
  autoSentDraftMessageId?: string;
};

function parseChatProviderParam(
  provider: string | string[] | ChatProviderParam | undefined,
): ChatProviderParam | null {
  try {
    const raw = Array.isArray(provider) ? provider[0] : provider;
    if (raw == null) return null;
    if (typeof raw === 'object') {
      const obj = raw as ChatProviderParam;
      return obj.id && obj.name ? obj : null;
    }
    const parsed = JSON.parse(String(raw)) as ChatProviderParam;
    if (!parsed?.id || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function ChatTab() {
  const { user, refreshUserFromApi } = useAuth();
  const { provider, returnTo } = useLocalSearchParams<{
    provider?: string;
    returnTo?: string | string[];
  }>();
  const data = parseChatProviderParam(provider as string | string[] | undefined);
  const { addOrUpdateConversation, getConversation } = useConversations();
  const streamClientRef = useRef<StreamChat | null>(null);
  type CitizenFlowPending =
    | { step: 'cpf'; option: FlowOption }
    | {
        step: 'pick-ubs';
        option: FlowOption;
        name: string;
        cpf: string;
        units: HealthUnit[];
      }
    | {
        step: 'pick-specialty';
        option: FlowOption;
        name: string;
        cpf: string;
        unit: HealthUnit;
      }
    | {
        step: 'pick-date';
        option: FlowOption;
        name: string;
        cpf: string;
        unit: HealthUnit;
        specialty: string;
        slotsByDay: Record<string, HealthSlot[]>;
      }
    | {
        step: 'pick-time';
        option: FlowOption;
        name: string;
        cpf: string;
        unit: HealthUnit;
        specialty: string;
        dateLabel: string;
        daySlots: HealthSlot[];
      }
    | { step: 'description'; option: FlowOption; name: string; cpf: string }
    | { step: 'await-end' };
  const citizenFlowRef = useRef<CitizenFlowPending | null>(null);
  const flowBusyRef = useRef(false);

  const clearMessageOptions = (list: ChatMessage[]): ChatMessage[] =>
    list.map((msg) => (msg.options ? { ...msg, options: undefined } : msg));

  const pushLoading = (text: string): string => {
    const id = `${Date.now()}-loading`;
    setMessages((prev) => [
      ...clearMessageOptions(prev),
      {
        id,
        text,
        isFromOther: true,
        timestamp: new Date(),
        loading: true,
      },
    ]);
    return id;
  };

  const dropMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const messagesInboxRoute = useMemo(
    () =>
      resolveMessagesInboxRoute({
        returnTo,
        email: user?.email,
        profile: user?.profile,
      }),
    [returnTo, user?.email, user?.profile],
  );

  useEffect(() => {
    if (data) return;
    router.replace(messagesInboxRoute as Href);
  }, [data, messagesInboxRoute]);

  const responseConfig = useMemo(
    () => (data ? getChatResponseConfig(data.id) : undefined),
    [data],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [streamPeer, setStreamPeer] = useState<{
    id: string;
    name: string;
    image?: string;
  } | null>(null);

  const streamChannelInfo = useMemo(() => {
    if (!data) return null;
    const channelType = data.channelType;
    const channelId = data.channelId;
    if (channelType && channelId) {
      return { channelType, channelId };
    }
    if (data.cid && data.cid.includes(':')) {
      const [parsedType, ...idParts] = data.cid.split(':');
      const parsedId = idParts.join(':');
      if (parsedType && parsedId) {
        return { channelType: parsedType, channelId: parsedId };
      }
    }
    return null;
  }, [data]);

  const isStreamConversation = Boolean(streamChannelInfo);

  const existingConversation = useMemo(
    () => (data ? getConversation(data.id) : undefined),
    [data, getConversation],
  );

  const initialMessage = responseConfig
    ? responseConfig.initialMessage
    : chatCopy.fallbackInitialMessage(data?.name ?? 'contato');

  const ensureStreamClient = useCallback(async (): Promise<StreamChat> => {
    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error(errCopy.noSession);
    }
    if (!user?.id) {
      throw new Error(errCopy.noUser);
    }

    const displayName = streamAndUiDisplayName(user);
    const client = await ensureStreamChatConnected(user.id, displayName || 'Usuário');
    streamClientRef.current = client;
    return client;
  }, [user?.id, user?.name, user?.email]);

  useFocusEffect(useCallback(() => {
    if (!streamChannelInfo || !user?.id) {
      return;
    }

    let cancelled = false;
    const subscriptions: { unsubscribe: () => void }[] = [];

    const load = async () => {
      try {
        setIsStreamReady(false);
        const client = await ensureStreamClient();
        if (cancelled) return;
        const ch = client.channel(streamChannelInfo.channelType, streamChannelInfo.channelId);
        const state = await ch.watch();
        if (cancelled) return;
        const peer = getStreamChannelPeer(state.members, user.id);
        setStreamPeer(peer);
        const clearedAt = await getStreamChannelClearedAt(
          user.id,
          `${streamChannelInfo.channelType}:${streamChannelInfo.channelId}`,
        );
        let mapped = mapChannelStateToMessages(ch.state, user.id);
        const autoSentId = data?.autoSentDraftMessageId?.trim();
        if (autoSentId) {
          try {
            await client.deleteMessage(autoSentId);
          } catch {
            // mantém mensagem visível se não for possível remover
          }
          mapped = mapped.filter((msg) => msg.id !== autoSentId);
        }
        if (cancelled) return;
        setMessages(filterMessagesAfterClear(mapped, clearedAt));
        const syncMessages = () => {
          if (cancelled) return;
          void getStreamChannelClearedAt(user.id, ch.cid).then((cutoff) => {
            if (cancelled) return;
            const current = filterMessagesAfterClear(mapChannelStateToMessages(ch.state, user.id), cutoff);
            setMessages((previous) => [...current, ...previous.filter((message) => message.id.startsWith('tmp-'))]);
          });
        };
        subscriptions.push(ch.on('message.new', () => {
          syncMessages();
          if (AppState.currentState === 'active') {
            void markStreamChannelRead(streamChannelInfo.channelType, streamChannelInfo.channelId).catch(() => {});
          }
        }));
        subscriptions.push(ch.on('message.updated', syncMessages));
        subscriptions.push(ch.on('message.deleted', syncMessages));
        subscriptions.push(client.on('connection.recovered', syncMessages));
        syncMessages();
        setIsStreamReady(true);
        void markStreamChannelRead(
          streamChannelInfo.channelType,
          streamChannelInfo.channelId,
        ).catch(() => {});
      } catch (e) {
        if (!cancelled) {
          // Mantém composer visível; envio tenta reconectar. Evita tela sem campo de texto.
          setIsStreamReady(true);
          console.warn('[ChatTab] Stream watch failed:', e);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [ensureStreamClient, streamChannelInfo, user?.id, data?.autoSentDraftMessageId]));

  useEffect(() => {
    if (!isStreamConversation || !data) return;

    const peerId = streamPeer?.id?.trim() || data.id?.trim();
    if (!isChatPeerUserId(peerId)) return;

    const existing = streamPeer?.image?.trim() || data.image?.trim();
    if (existing) {
      if (!streamPeer?.image && existing) {
        setStreamPeer((prev) =>
          prev
            ? { ...prev, image: existing }
            : { id: peerId, name: data.name, image: existing },
        );
      }
      return;
    }

    let cancelled = false;
    void resolveChatPeerPhotoUrl(peerId).then((photoUrl) => {
      if (cancelled || !photoUrl) return;
      setStreamPeer((prev) => {
        const name = prev?.name ?? data.name;
        return { id: peerId, name, image: photoUrl };
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isStreamConversation, streamPeer?.id, streamPeer?.image, data]);

  useEffect(() => {
    if (isStreamConversation) {
      return;
    }

    if (existingConversation && messages.length === 0) {
      const restoredText = responseConfig ? initialMessage : existingConversation.lastMessage;
      setMessages([
        {
          id: '1',
          text: restoredText,
          isFromOther: true,
          timestamp: new Date(),
          options: responseConfig?.initialOptions?.map((opt) => ({
            id: opt.id,
            label: opt.label,
            emoji: opt.emoji,
          })),
        },
      ]);
    } else if (!existingConversation && messages.length === 0) {
      const initialMsg: ChatMessage = {
        id: '1',
        text: initialMessage,
        isFromOther: true,
        timestamp: new Date(),
        options: responseConfig?.initialOptions?.map((opt) => ({
          id: opt.id,
          label: opt.label,
          emoji: opt.emoji,
        })),
      };
      setMessages([initialMsg]);
      addOrUpdateConversation(data, initialMessage);
    }
  }, [
    addOrUpdateConversation,
    data,
    existingConversation,
    initialMessage,
    isStreamConversation,
    messages.length,
    responseConfig?.initialOptions,
  ]);

  const participant: ChatParticipant = {
    id: streamPeer?.id ?? data.id,
    name: streamPeer?.name ?? data.name,
    image: streamPeer?.image ?? data.image,
    icon:
      data.id === 'comunicados-oficiais'
        ? 'shield-checkmark'
        : data.id === 'iptu'
          ? 'receipt'
          : undefined,
    showOnlineStatus: true,
    isOnline: true,
  };

  const handleBack = () => {
    router.replace(messagesInboxRoute as Href);
  };

  if (!data) {
    return null;
  }

  const handleClearStreamConversation = useCallback(async () => {
    if (!streamChannelInfo || !user?.id) return;
    await clearStreamChannelHistory(
      streamChannelInfo.channelType,
      streamChannelInfo.channelId,
      user.id,
    );
    setMessages([]);
    router.replace(messagesInboxRoute as Href);
  }, [messagesInboxRoute, streamChannelInfo, user?.id]);

  const handleSaveConversation = (lastMessage: string) => {
    if (!isStreamConversation) {
      addOrUpdateConversation(data, lastMessage);
    }
  };

  const mapOptionsForMessage = useCallback(
    () =>
      responseConfig?.initialOptions?.map((opt) => ({
        id: opt.id,
        label: opt.label,
        emoji: opt.emoji,
      })),
    [responseConfig?.initialOptions],
  );

  const appendEndOptions = useCallback(
    (msg: ChatMessage): ChatMessage => ({
      ...msg,
      options: endServiceUiOptions(),
    }),
    [],
  );

  const finishWithEndOption = useCallback(
    (finalText: string, processingText?: string) => {
      citizenFlowRef.current = { step: 'await-end' };
      setMessages((prev) => {
        const base = clearMessageOptions(prev);
        const next: ChatMessage[] = [...base];
        if (processingText) {
          next.push({
            id: `${Date.now()}-proc`,
            text: processingText,
            isFromOther: true,
            timestamp: new Date(),
          });
        }
        next.push(
          appendEndOptions({
            id: `${Date.now()}-final`,
            text: finalText,
            isFromOther: true,
            timestamp: new Date(),
          }),
        );
        return next;
      });
      addOrUpdateConversation(data, finalText);
    },
    [addOrUpdateConversation, appendEndOptions, data],
  );

  const handleOptionSelect = (option: ChatOption) => {
    if (!responseConfig) return;

    if (option.id === END_SERVICE_OPTION_ID) {
      citizenFlowRef.current = null;
      const userMessage: ChatMessage = {
        id: `${Date.now()}-end-user`,
        text: mockCopy.endServiceResponse,
        isFromOther: false,
        timestamp: new Date(),
        emoji: '🔚',
      };
      const menu: ChatMessage = {
        id: `${Date.now()}-end-menu`,
        text: mockCopy.endedService,
        isFromOther: true,
        timestamp: new Date(),
        options: mapOptionsForMessage(),
      };
      setMessages((prev) => [...clearMessageOptions(prev), userMessage, menu]);
      addOrUpdateConversation(data, mockCopy.endedService);
      return;
    }

    const pending = citizenFlowRef.current;
    if (flowBusyRef.current) return;

    if (pending?.step === 'pick-ubs' && option.id.startsWith('pick-ubs-')) {
      const unitId = option.id.replace('pick-ubs-', '');
      const unit = pending.units.find((item) => item.id === unitId);
      if (!unit) return;
      flowBusyRef.current = true;
      setMessages((prev) => [
        ...clearMessageOptions(prev),
        {
          id: `${Date.now()}-ubs-user`,
          text: option.label,
          isFromOther: false,
          timestamp: new Date(),
        },
      ]);
      const loadingId = pushLoading(mockCopy.loadingSpecialties);
      void (async () => {
        try {
          await briefDelay(600);
          const options = specialtyOptionsForUnit(unit);
          dropMessage(loadingId);
          if (!options.length) {
            finishWithEndOption('Esta UBS não tem especialidades disponíveis no momento.');
            return;
          }
          citizenFlowRef.current = {
            step: 'pick-specialty',
            option: pending.option,
            name: pending.name,
            cpf: pending.cpf,
            unit,
          };
          setMessages((prev) => [
            ...clearMessageOptions(prev),
            {
              id: `${Date.now()}-specialty`,
              text: mockCopy.pickSpecialty,
              isFromOther: true,
              timestamp: new Date(),
              options,
            },
          ]);
        } catch (e) {
          dropMessage(loadingId);
          finishWithEndOption(
            e instanceof Error ? e.message : 'Não foi possível carregar as especialidades.',
          );
        } finally {
          flowBusyRef.current = false;
        }
      })();
      return;
    }

    if (pending?.step === 'pick-specialty' && option.id.startsWith('pick-specialty-')) {
      flowBusyRef.current = true;
      setMessages((prev) => [
        ...clearMessageOptions(prev),
        {
          id: `${Date.now()}-spec-user`,
          text: option.label,
          isFromOther: false,
          timestamp: new Date(),
        },
      ]);
      const loadingId = pushLoading(mockCopy.loadingAgenda);
      void (async () => {
        try {
          const [{ dateOptions, slotsByDay }] = await Promise.all([
            loadSlotsForChat(pending.unit.id, option.label),
            briefDelay(700),
          ]);
          dropMessage(loadingId);
          if (!dateOptions.length) {
            finishWithEndOption(
              'Não há horários disponíveis para esta especialidade nesta UBS nos próximos dias.',
            );
            return;
          }
          citizenFlowRef.current = {
            step: 'pick-date',
            option: pending.option,
            name: pending.name,
            cpf: pending.cpf,
            unit: pending.unit,
            specialty: option.label,
            slotsByDay,
          };
          setMessages((prev) => [
            ...clearMessageOptions(prev),
            {
              id: `${Date.now()}-date`,
              text: mockCopy.pickDate,
              isFromOther: true,
              timestamp: new Date(),
              options: dateOptions,
            },
          ]);
        } catch (e) {
          dropMessage(loadingId);
          finishWithEndOption(
            e instanceof Error ? e.message : 'Não foi possível consultar a agenda.',
          );
        } finally {
          flowBusyRef.current = false;
        }
      })();
      return;
    }

    if (pending?.step === 'pick-date' && option.id.startsWith('pick-date-')) {
      const dayKey = option.id.replace('pick-date-', '');
      const daySlots = pending.slotsByDay[dayKey] ?? [];
      flowBusyRef.current = true;
      setMessages((prev) => [
        ...clearMessageOptions(prev),
        {
          id: `${Date.now()}-date-user`,
          text: option.label,
          isFromOther: false,
          timestamp: new Date(),
        },
      ]);
      const loadingId = pushLoading(mockCopy.loadingTimes);
      void (async () => {
        try {
          await briefDelay(500);
          dropMessage(loadingId);
          const options = timeOptionsForDay(daySlots);
          if (!options.length) {
            finishWithEndOption('Não há horários neste dia. Escolha outra data após encerrar.');
            return;
          }
          citizenFlowRef.current = {
            step: 'pick-time',
            option: pending.option,
            name: pending.name,
            cpf: pending.cpf,
            unit: pending.unit,
            specialty: pending.specialty,
            dateLabel: option.label,
            daySlots,
          };
          setMessages((prev) => [
            ...clearMessageOptions(prev),
            {
              id: `${Date.now()}-time`,
              text: mockCopy.pickTime,
              isFromOther: true,
              timestamp: new Date(),
              options,
            },
          ]);
        } finally {
          flowBusyRef.current = false;
        }
      })();
      return;
    }

    if (pending?.step === 'pick-time' && option.id.startsWith('pick-slot-')) {
      const slotId = option.id.replace('pick-slot-', '');
      const slot = pending.daySlots.find((item) => item.id === slotId);
      if (!slot) return;
      flowBusyRef.current = true;
      setMessages((prev) => [
        ...clearMessageOptions(prev),
        {
          id: `${Date.now()}-time-user`,
          text: option.label,
          isFromOther: false,
          timestamp: new Date(),
        },
      ]);
      const loadingId = pushLoading(mockCopy.loadingBook);
      void (async () => {
        try {
          const [appointment] = await Promise.all([
            bookChatAppointment({
              slotId: slot.id,
              patientName: pending.name,
              patientCpf: pending.cpf,
              reason: `Agendado pelo chat — ${pending.specialty}`,
            }),
            briefDelay(700),
          ]);
          dropMessage(loadingId);
          void scheduleAppointmentReminder(appointment).catch(() => {});
          const protocol = appointment.id.slice(0, 8).toUpperCase();
          const finalText =
            pending.option.buildFinalMessage?.({
              name: pending.name,
              cpf: pending.cpf,
              specialty: appointment.specialty,
              ubs: appointment.unit.name,
              date: pending.dateLabel,
              time: option.label,
              protocol,
            }) ||
            `Consulta agendada.\n\n• Protocolo: ${protocol}\n• ${formatSlotDateTime(appointment.startsAt)}\n• ${appointment.unit.name}\n\nO agendamento já aparece em Saúde → Meus agendamentos.`;
          finishWithEndOption(finalText);
        } catch (e) {
          dropMessage(loadingId);
          finishWithEndOption(
            e instanceof Error
              ? e.message
              : 'Não foi possível confirmar o agendamento. Tente novamente.',
          );
        } finally {
          flowBusyRef.current = false;
        }
      })();
      return;
    }

    const fullOption =
      responseConfig.initialOptions?.find((opt) => opt.id === option.id) ||
      Object.values(responseConfig.responses)
        .flatMap((r) => r.options || [])
        .find((opt) => opt.id === option.id);

    if (!fullOption) return;

    const needsCpf =
      fullOption.flowKind === 'cpf-then-final' ||
      fullOption.flowKind === 'cpf-then-schedule' ||
      fullOption.flowKind === 'cpf-then-description-then-final';

    if (needsCpf) {
      citizenFlowRef.current = { step: 'cpf', option: fullOption };
    } else if (fullOption.flowKind === 'info-only') {
      if (flowBusyRef.current) return;
      flowBusyRef.current = true;
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: fullOption.response,
        isFromOther: false,
        timestamp: new Date(),
        emoji: fullOption.emoji,
      };
      setMessages((prev) => [...clearMessageOptions(prev), userMessage]);
      addOrUpdateConversation(data, fullOption.response);
      const loadingId = pushLoading(loadingLabelForOption(fullOption.id));
      void (async () => {
        try {
          const [text] = await Promise.all([
            resolveChatServiceResult({
              optionId: fullOption.id,
              name: user?.name?.trim() || 'Cidadão',
              cpf: user?.cpf?.replace(/\D/g, '') || '',
            }),
            briefDelay(550),
          ]);
          dropMessage(loadingId);
          finishWithEndOption(text || fullOption.followUpMessage || mockCopy.finalDefault);
        } catch (e) {
          dropMessage(loadingId);
          finishWithEndOption(
            e instanceof Error
              ? e.message
              : fullOption.followUpMessage || mockCopy.finalDefault,
          );
        } finally {
          flowBusyRef.current = false;
        }
      })();
      return;
    } else {
      citizenFlowRef.current = null;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: fullOption.response,
      isFromOther: false,
      timestamp: new Date(),
      emoji: fullOption.emoji,
    };

    const systemMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: fullOption.followUpMessage || '',
      isFromOther: true,
      timestamp: new Date(),
      options:
        !fullOption.waitForUserInput && !needsCpf ? endServiceUiOptions() : undefined,
    };

    setMessages((prev) => [...clearMessageOptions(prev), userMessage, systemMessage]);
    addOrUpdateConversation(data, systemMessage.text || fullOption.response);
  };

  const handleSendMessage = (text: string) => {
    if (isStreamConversation && streamChannelInfo && user?.id) {
      const optimisticMessage: ChatMessage = {
        id: `tmp-${Date.now()}`,
        text,
        isFromOther: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      const sendToStream = async () => {
        try {
          const client = streamClientRef.current ?? (await ensureStreamClient());
          streamClientRef.current = client;
          const channel = client.channel(
            streamChannelInfo.channelType,
            streamChannelInfo.channelId,
          );
          if (!channel.initialized) {
            await channel.watch();
            if (!isStreamReady) setIsStreamReady(true);
          }
          const res = await channel.sendMessage({ text });
          setMessages((prev) =>
            prev.filter((m) => m.id !== res.message.id).map((m) =>
              m.id === optimisticMessage.id
                ? {
                    ...m,
                    id: res.message.id || m.id,
                    timestamp: res.message.created_at
                      ? new Date(res.message.created_at)
                      : m.timestamp,
                  }
                : m,
            ),
          );
        } catch (e) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
          Alert.alert(
            'Chat',
            e instanceof Error
              ? e.message
              : 'Não foi possível enviar a mensagem. Verifique a conexão e tente novamente.',
          );
        }
      };

      void sendToStream();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    const pending = citizenFlowRef.current;

    if (pending?.step === 'cpf') {
      const option = pending.option;
      const userLineId = `${Date.now()}-cpf-user`;
      const checkingId = `${Date.now()}-cpf-checking`;
      setMessages((prev) => [
        ...prev,
        {
          id: userLineId,
          text: trimmed,
          isFromOther: false,
          timestamp: new Date(),
        },
        {
          id: checkingId,
          text: mockCopy.cpfChecking,
          isFromOther: true,
          timestamp: new Date(),
          loading: true,
        },
      ]);

      void (async () => {
        let sessionUser = user;
        try {
          if (user?.id) {
            const details = await authApi.getUserById(user.id);
            sessionUser = {
              ...user,
              cpf: details.cpf ?? user.cpf ?? null,
              name: details.name?.trim() || user.name,
            };
            await refreshUserFromApi();
          }
        } catch {
          // mantém CPF da sessão local
        }

        const check = checkCitizenCpfAgainstSession(trimmed, sessionUser);
        if (!check.ok) {
          setMessages((prev) => [
            ...clearMessageOptions(prev.filter((m) => m.id !== checkingId)),
            {
              id: `${Date.now()}-cpf-err`,
              text: check.message,
              isFromOther: true,
              timestamp: new Date(),
            },
          ]);
          addOrUpdateConversation(data, check.message);
          return;
        }

        if (option.flowKind === 'cpf-then-schedule') {
          setMessages((prev) => clearMessageOptions(prev.filter((m) => m.id !== checkingId)));
          const loadingId = pushLoading(mockCopy.loadingUnits);
          try {
            const [{ units, options },] = await Promise.all([
              loadChatUbsOptions(),
              briefDelay(650),
            ]);
            dropMessage(loadingId);
            if (!options.length) {
              finishWithEndOption(
                'Não encontrei UBS com agenda disponível no momento. Tente de novo mais tarde.',
              );
              return;
            }
            citizenFlowRef.current = {
              step: 'pick-ubs',
              option,
              name: check.citizenName,
              cpf: check.cpf,
              units,
            };
            setMessages((prev) => [
              ...clearMessageOptions(prev),
              {
                id: `${Date.now()}-ubs`,
                text: mockCopy.pickUbs,
                isFromOther: true,
                timestamp: new Date(),
                options,
              },
            ]);
            addOrUpdateConversation(data, 'CPF confirmado');
          } catch (e) {
            dropMessage(loadingId);
            finishWithEndOption(
              e instanceof Error
                ? e.message
                : 'Não foi possível buscar as unidades. Verifique a conexão e tente novamente.',
            );
          }
          return;
        }

        if (option.flowKind === 'cpf-then-description-then-final') {
          citizenFlowRef.current = {
            step: 'description',
            option,
            name: check.citizenName,
            cpf: check.cpf,
          };
          setMessages((prev) => [
            ...clearMessageOptions(prev.filter((m) => m.id !== checkingId)),
            {
              id: `${Date.now()}-desc`,
              text:
                option.afterCpfPrompt ||
                'CPF confirmado. Descreva a ocorrência com local aproximado.',
              isFromOther: true,
              timestamp: new Date(),
            },
          ]);
          addOrUpdateConversation(data, 'CPF confirmado');
          return;
        }

        // cpf-then-final e demais: busca real / orientação com loading
        setMessages((prev) => clearMessageOptions(prev.filter((m) => m.id !== checkingId)));
        const loadingId = pushLoading(
          option.processingMessage || loadingLabelForOption(option.id),
        );
        try {
          const [finalText] = await Promise.all([
            resolveChatServiceResult({
              optionId: option.id,
              name: check.citizenName,
              cpf: check.cpf,
            }),
            briefDelay(600),
          ]);
          dropMessage(loadingId);
          finishWithEndOption(
            finalText ||
              option.buildFinalMessage?.({
                name: check.citizenName,
                cpf: check.cpf,
                protocol: makeFlowProtocol(option.id.slice(0, 3).toUpperCase() || 'ROT'),
              }) ||
              option.finalMessage ||
              mockCopy.finalDefault,
          );
        } catch (e) {
          dropMessage(loadingId);
          finishWithEndOption(
            e instanceof Error ? e.message : 'Não foi possível concluir a consulta. Tente novamente.',
          );
        }
      })();
      return;
    }

    if (pending?.step === 'description') {
      if (flowBusyRef.current) return;
      const description = trimmed;
      flowBusyRef.current = true;
      setMessages((prev) => [
        ...clearMessageOptions(prev),
        {
          id: `${Date.now()}-desc-user`,
          text: description,
          isFromOther: false,
          timestamp: new Date(),
        },
      ]);
      const loadingId = pushLoading(
        pending.option.processingMessage || loadingLabelForOption(pending.option.id),
      );
      void (async () => {
        try {
          const [finalText] = await Promise.all([
            resolveChatServiceResult({
              optionId: pending.option.id,
              name: pending.name,
              cpf: pending.cpf,
              description,
            }),
            briefDelay(650),
          ]);
          dropMessage(loadingId);
          finishWithEndOption(finalText || mockCopy.finalDefault);
        } catch (e) {
          dropMessage(loadingId);
          finishWithEndOption(
            e instanceof Error
              ? e.message
              : 'Não foi possível concluir o registro. Tente novamente.',
          );
        } finally {
          flowBusyRef.current = false;
        }
      })();
      return;
    }

    setMessages((prev) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: trimmed,
        isFromOther: false,
        timestamp: new Date(),
      };

      if (responseConfig?.freeTextReply) {
        citizenFlowRef.current = { step: 'await-end' };
        addOrUpdateConversation(data, trimmed);
        return [
          ...clearMessageOptions(prev),
          userMessage,
          appendEndOptions({
            id: `${Date.now() + 1}-free`,
            text: responseConfig.freeTextReply,
            isFromOther: true,
            timestamp: new Date(),
          }),
        ];
      }

      addOrUpdateConversation(data, trimmed);
      return [...clearMessageOptions(prev), userMessage];
    });
  };

  return (
    <ChatScreen
      participant={participant}
      initialMessages={messages.length > 0 ? messages : undefined}
      onBack={handleBack}
      onSaveConversation={handleSaveConversation}
      onOptionSelect={isStreamConversation ? undefined : handleOptionSelect}
      onSendMessage={handleSendMessage}
      /* Stream: sempre mostra o campo; envio reconecta se watch falhou. */
      canSendMessages
      showClearConversation={isStreamConversation && Boolean(streamChannelInfo)}
      onClearConversation={
        isStreamConversation && streamChannelInfo ? handleClearStreamConversation : undefined
      }
      draftMessage={data.draftMessage}
    />
  );
}
