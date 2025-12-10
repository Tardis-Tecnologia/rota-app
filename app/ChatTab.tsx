import ChatScreen, { ChatMessage, ChatOption, ChatParticipant } from '@/components/ChatScreen';
import { useConversations } from '@/contexts/ConversationsContext';
import { getChatResponseConfig } from '@/data/chatResponses';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';

/**
 * Tela de chat genérica para todas as conversas
 * Funciona tanto para providers quanto para conversas do sistema
 */
export default function ChatTab() {
  const { provider } = useLocalSearchParams();
  const data = JSON.parse(provider as string);
  const { addOrUpdateConversation, getConversation } = useConversations();
  
  // Busca configuração de respostas automáticas para este provider
  const responseConfig = useMemo(() => getChatResponseConfig(data.id), [data.id]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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

  // Inicializa mensagens
  useEffect(() => {
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
  }, []);

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
      onOptionSelect={handleOptionSelect}
      onSendMessage={handleSendMessage}
      canSendMessages={true}
    />
  );
}

