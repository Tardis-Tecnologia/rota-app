import ChatScreen, { ChatMessage, ChatOption, ChatParticipant } from '@/components/ChatScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/contexts/ConversationsContext';
import { getChatResponseConfig } from '@/data/chatResponses';
import { getApiBaseUrl, getAuthToken } from '@/services/authApi';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';

/**
 * Tela de chat genérica para todas as conversas
 * Funciona tanto para providers quanto para conversas do sistema
 */
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
  };
  const { addOrUpdateConversation, getConversation } = useConversations();
  const streamClientRef = useRef<StreamChat | null>(null);

  // Busca configuração de respostas automáticas para este provider
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

  // Verifica se já existe uma conversa
  const existingConversation = useMemo(() => getConversation(data.id), [data.id, getConversation]);

  // Prepara mensagem inicial com opções se houver configuração
  const getInitialMessage = () => {
    if (responseConfig) {
      return responseConfig.initialMessage;
    }
    return `Olá! Você iniciou uma conversa com ${data.name}. Como posso te ajudar hoje?`;
  };

  const initialMessage = getInitialMessage();

  // Inicializa mensagens para chats legados (sem Stream)
  useEffect(() => {
    if (isStreamConversation) return;

    if (existingConversation && messages.length === 0) {
      // Se já existe conversa, carrega a última mensagem
      setMessages([
        {
          id: '1',
          text: existingConversation.lastMessage,
          isFromOther: true,
          timestamp: new Date(),
          options: responseConfig?.initialOptions?.map(opt => ({
            id: opt.id,
            label: opt.label,
            emoji: opt.emoji,
          })),
        },
      ]);
    } else if (!existingConversation && messages.length === 0) {
      // Nova conversa - cria mensagem inicial com opções
      const initialMsg: ChatMessage = {
        id: '1',
        text: initialMessage,
        isFromOther: true,
        timestamp: new Date(),
        options: responseConfig?.initialOptions?.map(opt => ({
          id: opt.id,
          label: opt.label,
          emoji: opt.emoji,
        })),
      };
      setMessages([initialMsg]);
      addOrUpdateConversation(data, initialMessage);
    }
  }, [addOrUpdateConversation, data, existingConversation, initialMessage, isStreamConversation, messages.length, responseConfig?.initialOptions]);

  useEffect(() => {
    if (!isStreamConversation || !streamChannelInfo || !user?.id) return;

    const authToken = getAuthToken();
    if (!authToken) return;

    let isMounted = true;

    const loadStreamMessages = async () => {
      try {
        setIsStreamReady(false);
        const tokenRes = await fetch(`${getApiBaseUrl()}/api/v1/stream-chat/token`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
          },
        });
        if (!tokenRes.ok) {
          throw new Error(`Falha ao obter token do Stream (${tokenRes.status})`);
        }

        const { token, apiKey } = (await tokenRes.json()) as { token: string; apiKey: string };
        const client = StreamChat.getInstance(apiKey);
        streamClientRef.current = client;

        if (!client.userID) {
          await client.connectUser({ id: user.id, name: user.name || undefined }, token);
        }

        const channel = client.channel(streamChannelInfo.channelType, streamChannelInfo.channelId);
        const state = await channel.watch();
        if (!isMounted) return;

        const mapped = (state.messages || []).map<ChatMessage>((msg) => ({
          id: msg.id || `${msg.created_at || Date.now()}`,
          text: msg.text || '',
          isFromOther: msg.user?.id !== user.id,
          timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
        }));
        setMessages(mapped);
        setIsStreamReady(true);
      } catch {
        if (!isMounted) return;
        setIsStreamReady(false);
      }
    };

    void loadStreamMessages();
    return () => {
      isMounted = false;
    };
  }, [isStreamConversation, streamChannelInfo, user?.id, user?.name]);

  const participant: ChatParticipant = {
    id: data.id,
    name: data.name,
    image: data.image,
    icon: data.id === 'comunicados-oficiais' ? 'shield-checkmark' : 
          data.id === 'iptu' ? 'receipt' : undefined,
    showOnlineStatus: true,
    isOnline: true,
  };

  const handleBack = () => {
    router.replace('/(tabs)/messages');
  };

  const handleSaveConversation = (lastMessage: string) => {
    addOrUpdateConversation(data, lastMessage);
  };

  // Processa quando uma opção é selecionada
  const handleOptionSelect = (option: ChatOption) => {
    if (!responseConfig) return;

    // Encontra a opção completa na configuração
    const fullOption = responseConfig.initialOptions?.find(opt => opt.id === option.id) ||
                      Object.values(responseConfig.responses).flatMap(r => r.options || [])
                        .find(opt => opt.id === option.id);

    if (!fullOption) return;

    // Adiciona mensagem do usuário (resposta da opção) com emoji
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: fullOption.response,
      isFromOther: false,
      timestamp: new Date(),
      emoji: fullOption.emoji, // Inclui o emoji da opção na mensagem
    };

    // Adiciona mensagem de follow-up do sistema
    // Se waitForUserInput for true, NÃO mostra opções ainda (espera input do usuário)
    const systemMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: fullOption.followUpMessage || '',
      isFromOther: true,
      timestamp: new Date(),
      // Só mostra opções se NÃO estiver esperando input do usuário
      options: !fullOption.waitForUserInput && fullOption.showOptionsAfter
        ? responseConfig.initialOptions?.map(opt => ({
            id: opt.id,
            label: opt.label,
            emoji: opt.emoji,
          }))
        : undefined,
    };

    setMessages(prev => [...prev, userMessage, systemMessage]);
    
    // Atualiza última mensagem no contexto
    addOrUpdateConversation(data, systemMessage.text);
  };

  // Handler para mensagens enviadas manualmente
  const handleSendMessage = (text: string) => {
    if (isStreamConversation && streamChannelInfo && user?.id && streamClientRef.current) {
      const optimisticMessage: ChatMessage = {
        id: `tmp-${Date.now()}`,
        text,
        isFromOther: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      addOrUpdateConversation(data, text);

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
                    timestamp: res.message.created_at ? new Date(res.message.created_at) : m.timestamp,
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

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isFromOther: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => {
      const updated = [...prev, userMessage];
      
      // Só processa respostas automáticas se houver configuração
      if (responseConfig) {
        // Verifica se a última mensagem do sistema estava esperando input
        const lastSystemMessage = prev.filter(m => m.isFromOther).pop();
        if (lastSystemMessage) {
          // Busca a opção que gerou essa mensagem
          const optionThatTriggered = responseConfig.initialOptions?.find(opt => 
            opt.followUpMessage === lastSystemMessage.text && opt.waitForUserInput
          );
          
          if (optionThatTriggered) {
            // Adiciona mensagem de processamento
            const processingMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              text: optionThatTriggered.processingMessage || 'Processando...',
              isFromOther: true,
              timestamp: new Date(),
            };
            
            // Adiciona mensagem final
            const finalMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              text: optionThatTriggered.finalMessage || 'Pronto! Posso ajudar com mais alguma coisa?',
              isFromOther: true,
              timestamp: new Date(),
              // Mostra opções novamente se configurado
              options: optionThatTriggered.showOptionsAfter
                ? responseConfig.initialOptions?.map(opt => ({
                    id: opt.id,
                    label: opt.label,
                    emoji: opt.emoji,
                  }))
                : undefined,
            };
            
            return [...updated, processingMessage, finalMessage];
          }
        }
      }
      
      return updated;
    });
    
    // Atualiza última mensagem no contexto
    addOrUpdateConversation(data, text);
  };

  return (
    <ChatScreen
      participant={participant}
      initialMessages={messages.length > 0 ? messages : undefined}
      onBack={handleBack}
      onSaveConversation={handleSaveConversation}
      onOptionSelect={isStreamConversation ? undefined : handleOptionSelect}
      onSendMessage={handleSendMessage}
      canSendMessages={isStreamConversation ? isStreamReady : true}
    />
  );
}

