import ChatScreen, { ChatMessage, ChatOption, ChatParticipant } from '@/components/ChatScreen';
import { chatCopy } from '@/constants/chatCopy';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/contexts/ConversationsContext';
import { getChatResponseConfig } from '@/data/chatResponses';
import { getApiBaseUrl, getAuthToken, getWhitelabelHostId } from '@/services/authApi';
import { ensureStreamChatConnected, markStreamChannelRead } from '@/services/streamChatApi';
import { streamAndUiDisplayName } from '@/utils/userDisplayName';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';

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
  state: { messages?: Array<{ id?: string; text?: string; created_at?: string; user?: { id?: string } }> },
  currentUserId: string,
): ChatMessage[] {
  return (state.messages || []).map<ChatMessage>((msg) => ({
    id: msg.id || `${msg.created_at || Date.now()}`,
    text: msg.text || '',
    isFromOther: msg.user?.id !== currentUserId,
    timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
  }));
}

export default function ChatTab() {
  const { user } = useAuth();
  const { provider } = useLocalSearchParams();
  const data = JSON.parse(provider as string) as {
    id: string;
    name: string;
    image?: string;
    channelId?: string;
    channelType?: string;
    cid?: string;
    draftMessage?: string;
  };
  const { addOrUpdateConversation, getConversation } = useConversations();
  const streamClientRef = useRef<StreamChat | null>(null);
  const agendamentoHandoffRef = useRef<{
    optionId: string;
    especialidade: string;
    handoffChannelName: string;
    secondStepPrompt: string;
  } | null>(null);

  const responseConfig = useMemo(() => getChatResponseConfig(data.id), [data.id]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreamReady, setIsStreamReady] = useState(false);

  const streamChannelInfo = useMemo(() => {
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
  }, [data.channelId, data.channelType, data.cid]);

  const isStreamConversation = Boolean(streamChannelInfo);

  const existingConversation = useMemo(() => getConversation(data.id), [data.id, getConversation]);

  const getInitialMessage = () => {
    if (responseConfig) {
      return responseConfig.initialMessage;
    }
    return chatCopy.fallbackInitialMessage(data.name);
  };

  const initialMessage = getInitialMessage();

  const ensureStreamClient = useCallback(async (): Promise<StreamChat> => {
    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error(errCopy.noSession);
    }
    if (!user?.id) {
      throw new Error(errCopy.noUser);
    }

    const displayName = streamAndUiDisplayName(user);
    const client = await ensureStreamChatConnected(user.id, displayName);
    streamClientRef.current = client;
    return client;
  }, [user?.id, user?.name, user?.email]);

  useEffect(() => {
    if (!streamChannelInfo || !user?.id) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setIsStreamReady(false);
        const client = await ensureStreamClient();
        const ch = client.channel(streamChannelInfo.channelType, streamChannelInfo.channelId);
        const state = await ch.watch();
        if (cancelled) return;
        setMessages(mapChannelStateToMessages(state, user.id));
        setIsStreamReady(true);
        void markStreamChannelRead(
          streamChannelInfo.channelType,
          streamChannelInfo.channelId,
        ).catch(() => {});
      } catch {
        if (!cancelled) {
          setIsStreamReady(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [ensureStreamClient, streamChannelInfo, user?.id]);

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
    id: data.id,
    name: data.name,
    image: data.image,
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
    router.replace('/(tabs)/messages');
  };

  const handleDeleteStreamConversation = useCallback(async () => {
    if (!streamChannelInfo) return;
    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error(errCopy.sessionRequired);
    }
    const url = streamChatUrl(
      `${encodeURIComponent(streamChannelInfo.channelType)}/${encodeURIComponent(streamChannelInfo.channelId)}`,
    );
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const msg = await parseFailedFetchMessage(res, errCopy.deleteConversationFailed);
      throw new Error(msg);
    }
    try {
      const ch = streamClientRef.current?.channel(
        streamChannelInfo.channelType,
        streamChannelInfo.channelId,
      );
      await ch?.stopWatching?.();
    } catch {
      // ignorar
    }
    router.replace('/(tabs)/messages');
  }, [streamChannelInfo]);

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

  const handleOptionSelect = (option: ChatOption) => {
    if (!responseConfig) return;

    const fullOption =
      responseConfig.initialOptions?.find((opt) => opt.id === option.id) ||
      Object.values(responseConfig.responses)
        .flatMap((r) => r.options || [])
        .find((opt) => opt.id === option.id);

    if (!fullOption) return;

    if (fullOption.handoffToAgent) {
      const connectingId = `${Date.now()}-connecting`;
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: fullOption.response,
        isFromOther: false,
        timestamp: new Date(),
        emoji: fullOption.emoji,
      };
      const connectingMessage: ChatMessage = {
        id: connectingId,
        text: handoffCopy.connectingAttendant,
        isFromOther: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage, connectingMessage]);
      addOrUpdateConversation(data, fullOption.response);

      const handoffChannelName = fullOption.handoffChannelName || `Atendimento — ${data.name}`;

      void (async () => {
        try {
          const handoff = await requestSupportHandoff(handoffChannelName);
          if (!handoff.ok) {
            throw new Error(handoff.message);
          }
          await postWaitMessage(handoff.channelType, handoff.channelId);
          router.replace({
            pathname: '/ChatTab',
            params: {
              provider: JSON.stringify({
                ...data,
                name: handoffChannelName,
                channelType: handoff.channelType,
                channelId: handoff.channelId,
                cid: handoff.cid,
              }),
            },
          });
        } catch (e) {
          const msg =
            e instanceof Error
              ? e.message
              : errCopy.handoffOpenFailedFallback;
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== connectingId),
            {
              id: `${Date.now()}-err`,
              text: msg,
              isFromOther: true,
              timestamp: new Date(),
              options: mapOptionsForMessage(),
            },
          ]);
        }
      })();

      return;
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
        !fullOption.waitForUserInput && fullOption.showOptionsAfter
          ? responseConfig.initialOptions?.map((opt) => ({
              id: opt.id,
              label: opt.label,
              emoji: opt.emoji,
            }))
          : undefined,
    };

    setMessages((prev) => [...prev, userMessage, systemMessage]);
    addOrUpdateConversation(data, systemMessage.text);
  };

  const handleSendMessage = (text: string) => {
    if (isStreamConversation && streamChannelInfo && user?.id && streamClientRef.current) {
      const optimisticMessage: ChatMessage = {
        id: `tmp-${Date.now()}`,
        text,
        isFromOther: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      const sendToStream = async () => {
        try {
          const channel = streamClientRef.current!.channel(
            streamChannelInfo.channelType,
            streamChannelInfo.channelId,
          );
          const res = await channel.sendMessage({ text });
          setMessages((prev) =>
            prev.map((m) =>
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
        } catch {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        }
      };

      void sendToStream();
      return;
    }

    const trimmed = text.trim();

    setMessages((prev) => {
      const others = prev.filter((m) => m.isFromOther);
      const lastSystemMessage = others[others.length - 1];

      const pend = agendamentoHandoffRef.current;
      if (pend && responseConfig && lastSystemMessage?.text === pend.secondStepPrompt) {
        const connectingId = `${Date.now()}-connecting-ag`;
        const snapshot = { ...pend };
        agendamentoHandoffRef.current = null;

        void (async () => {
          const handoff = await requestSupportHandoff(snapshot.handoffChannelName, {
            especialidade: snapshot.especialidade,
            cpf: trimmed,
          });
          if (!handoff.ok) {
            agendamentoHandoffRef.current = snapshot;
            setMessages((p) => [
              ...p.filter((m) => m.id !== connectingId),
              {
                id: `${Date.now()}-err`,
                text: handoff.message,
                isFromOther: true,
                timestamp: new Date(),
                options: mapOptionsForMessage(),
              },
            ]);
            return;
          }
          await postWaitMessage(handoff.channelType, handoff.channelId);
          router.replace({
            pathname: '/ChatTab',
            params: {
              provider: JSON.stringify({
                ...data,
                name: snapshot.handoffChannelName,
                channelType: handoff.channelType,
                channelId: handoff.channelId,
                cid: handoff.cid,
              }),
            },
          });
        })();

        return [
          ...prev,
          {
            id: connectingId,
            text: handoffCopy.openingConversation,
            isFromOther: true,
            timestamp: new Date(),
          },
        ];
      }

      if (responseConfig && lastSystemMessage) {
        const singleHandoffOpt = responseConfig.initialOptions?.find(
          (o) =>
            o.followUpMessage === lastSystemMessage.text &&
            o.waitForUserInput &&
            o.handoffAfterFirstInput &&
            o.handoffChannelName &&
            !(o.secondStepPrompt && o.handoffAfterSecondStep),
        );
        if (singleHandoffOpt?.handoffChannelName) {
          const connectingId = `${Date.now()}-connecting-1step`;
          const channelName = singleHandoffOpt.handoffChannelName;

          void (async () => {
            const handoff = await requestSupportHandoff(channelName, {
              especialidade: '',
              cpf: trimmed,
            });
            if (!handoff.ok) {
              setMessages((p) => [
                ...p.filter((m) => m.id !== connectingId),
                {
                  id: `${Date.now()}-err`,
                  text: handoff.message,
                  isFromOther: true,
                  timestamp: new Date(),
                  options: mapOptionsForMessage(),
                },
              ]);
              return;
            }
            await postWaitMessage(handoff.channelType, handoff.channelId);
            router.replace({
              pathname: '/ChatTab',
              params: {
                provider: JSON.stringify({
                  ...data,
                  name: channelName,
                  channelType: handoff.channelType,
                  channelId: handoff.channelId,
                  cid: handoff.cid,
                }),
              },
            });
          })();

          return [
            ...prev,
            {
              id: connectingId,
              text: handoffCopy.openingConversation,
              isFromOther: true,
              timestamp: new Date(),
            },
          ];
        }
      }

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: trimmed,
        isFromOther: false,
        timestamp: new Date(),
      };

      if (responseConfig && lastSystemMessage) {
        const multiOpt = responseConfig.initialOptions?.find(
          (o) =>
            o.followUpMessage === lastSystemMessage.text &&
            o.waitForUserInput &&
            o.secondStepPrompt &&
            o.handoffAfterSecondStep &&
            o.handoffChannelName,
        );
        if (multiOpt?.secondStepPrompt) {
          agendamentoHandoffRef.current = {
            optionId: multiOpt.id,
            especialidade: trimmed,
            handoffChannelName: multiOpt.handoffChannelName!,
            secondStepPrompt: multiOpt.secondStepPrompt,
          };
          const step2Msg: ChatMessage = {
            id: `${Date.now() + 1}-cpf`,
            text: multiOpt.secondStepPrompt,
            isFromOther: true,
            timestamp: new Date(),
          };
          const neutralUserLine: ChatMessage = {
            ...userMessage,
            text: mockCopy.specialtyRegistered,
          };
          addOrUpdateConversation(data, multiOpt.secondStepPrompt);
          return [...prev, neutralUserLine, step2Msg];
        }
      }

      const updated = [...prev, userMessage];

      if (responseConfig && lastSystemMessage) {
        const optionThatTriggered = responseConfig.initialOptions?.find(
          (opt) =>
            opt.followUpMessage === lastSystemMessage.text &&
            opt.waitForUserInput &&
            !(opt.secondStepPrompt && opt.handoffAfterSecondStep) &&
            !opt.handoffAfterFirstInput,
        );

        if (optionThatTriggered) {
          const processingMessage: ChatMessage = {
            id: `${Date.now() + 2}-proc`,
            text: optionThatTriggered.processingMessage || mockCopy.processingDefault,
            isFromOther: true,
            timestamp: new Date(),
          };

          const finalMessage: ChatMessage = {
            id: `${Date.now() + 3}-final`,
            text:
              optionThatTriggered.finalMessage || mockCopy.finalDefault,
            isFromOther: true,
            timestamp: new Date(),
            options: optionThatTriggered.showOptionsAfter
              ? responseConfig.initialOptions?.map((opt) => ({
                  id: opt.id,
                  label: opt.label,
                  emoji: opt.emoji,
                }))
              : undefined,
          };

          addOrUpdateConversation(data, trimmed);
          return [...updated, processingMessage, finalMessage];
        }
      }

      addOrUpdateConversation(data, trimmed);
      return updated;
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
      canSendMessages={
        isStreamConversation ? isStreamReady : data.id !== 'comunicados-oficiais'
      }
      showDeleteConversation={isStreamConversation && Boolean(streamChannelInfo)}
      onDeleteConversation={
        isStreamConversation && streamChannelInfo ? handleDeleteStreamConversation : undefined
      }
      draftMessage={data.draftMessage}
    />
  );
}
