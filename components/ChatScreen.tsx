import { chatCopy } from '@/constants/chatCopy';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ChatOption = {
  id: string;
  label: string;
  emoji?: string; // Emoji para o botão
};

export type ChatMessage = {
  id: string;
  text: string;
  isFromOther: boolean; // true se a mensagem é do outro lado (provider/notificação), false se é do usuário
  timestamp: Date;
  options?: ChatOption[]; // Opções interativas (botões) para esta mensagem
  emoji?: string; // Emoji para mensagens de opção selecionada
};

export type ChatParticipant = {
  id: string;
  name: string;
  image?: string;
  icon?: string; // Nome do ícone do Ionicons para usar ao invés de imagem
  showOnlineStatus?: boolean;
  isOnline?: boolean;
};

type ChatScreenProps = {
  participant: ChatParticipant;
  initialMessages?: ChatMessage[];
  initialMessage?: string;
  onBack?: () => void;
  onSendMessage?: (message: string) => void;
  onSaveConversation?: (lastMessage: string) => void;
  onOptionSelect?: (option: ChatOption) => void; // Callback quando uma opção é selecionada
  canSendMessages?: boolean; // Para notificações que não permitem resposta
  /** Conversas Stream: limpar mensagens mantendo a conversa no histórico. */
  showClearConversation?: boolean;
  onClearConversation?: () => Promise<void>;
  /** Texto pré-preenchido no campo de envio (ex.: interesse em produto do marketplace). */
  draftMessage?: string;
};

// Componente para mensagem animada
function AnimatedMessage({ children, messageId }: { children: React.ReactNode; messageId: string }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-15)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Só anima uma vez por mensagem
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [messageId]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// Componente para botão de opção animado
function AnimatedOptionButton({ 
  children, 
  delay, 
  onPress 
}: { 
  children: React.ReactNode; 
  delay: number; 
  onPress: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable style={styles.optionButton} onPress={onPress}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function ChatScreen({
  participant,
  initialMessages = [],
  initialMessage,
  onBack,
  onSendMessage,
  onSaveConversation,
  onOptionSelect,
  canSendMessages = true,
  showClearConversation = false,
  onClearConversation,
  draftMessage,
}: ChatScreenProps) {
  const [message, setMessage] = useState(draftMessage?.trim() ?? '');
  const [clearLoading, setClearLoading] = useState(false);
  const messagesScrollRef = useRef<ScrollView>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialMessages.length > 0) {
      return initialMessages;
    }
    if (initialMessage) {
      return [
        {
          id: '1',
          text: initialMessage,
          isFromOther: true,
          timestamp: new Date(),
        },
      ];
    }
    return [];
  });

  // Atualiza mensagens quando initialMessages mudar (para suportar mensagens dinâmicas)
  React.useEffect(() => {
    if (initialMessages.length > 0) {
      // Só atualiza se houver novas mensagens ou se a lista mudou
      setMessages(prev => {
        // Se o número de mensagens mudou ou se há novas mensagens, atualiza
        if (prev.length !== initialMessages.length || 
            prev[prev.length - 1]?.id !== initialMessages[initialMessages.length - 1]?.id) {
          return initialMessages;
        }
        return prev;
      });
    }
  }, [initialMessages]);

  const [imageError, setImageError] = useState(false);
  const latestMessageId = messages[messages.length - 1]?.id;

  const scrollToLatestMessage = useCallback(() => {
    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = requestAnimationFrame(() => {
      messagesScrollRef.current?.scrollToEnd({ animated: false });
      scrollFrameRef.current = null;
    });
  }, []);

  useEffect(() => {
    scrollToLatestMessage();
    return () => {
      if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    };
  }, [latestMessageId, scrollToLatestMessage]);

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const showFallback = !participant.image || imageError || participant.image === '';
  const useIcon = participant.icon && (!participant.image || participant.image === '');

  const handleBack = () => {
    if (onSaveConversation && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      onSaveConversation(lastMessage.text);
    }
    
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const ui = chatCopy.screen;

  const handleClearPress = () => {
    Alert.alert(ui.clearConversationTitle, ui.clearConversationMessage, [
      { text: ui.cancel, style: 'cancel' },
      {
        text: ui.clear,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (!onClearConversation) return;
            setClearLoading(true);
            try {
              await onClearConversation();
            } catch (e) {
              Alert.alert(
                ui.errorTitle,
                e instanceof Error ? e.message : ui.clearConversationError,
              );
            } finally {
              setClearLoading(false);
            }
          })();
        },
      },
    ]);
  };

  const handleSend = () => {
    if (message.trim() && canSendMessages) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isFromOther: false,
        timestamp: new Date(),
      };
      
      setMessage('');
      
      if (onSendMessage) {
        // Se há callback, delega o gerenciamento de mensagens para o componente pai
        onSendMessage(newMessage.text);
      } else {
        // Se não há callback, apenas adiciona a mensagem localmente
        setMessages((prev) => [...prev, newMessage]);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
        </Pressable>

        <View style={styles.participantInfo}>
          {useIcon ? (
            <View style={participant.id === 'iptu' ? styles.avatarIconContainerIptu : styles.avatarIconContainer}>
              <Ionicons 
                name={participant.icon as any} 
                size={24} 
                color={participant.id === 'iptu' ? AppColors.primary : AppColors.text.white} 
              />
            </View>
          ) : showFallback ? (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{getInitials(participant.name)}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: participant.image }}
              style={styles.avatar}
              onError={() => setImageError(true)}
            />
          )}
          <View style={styles.participantTextInfo}>
            <Text style={styles.participantName} numberOfLines={1}>
              {participant.name}
            </Text>
            {participant.showOnlineStatus && (
              <View style={styles.onlineStatus}>
                <View style={[styles.onlineDot, !participant.isOnline && styles.offlineDot]} />
                <Text style={[styles.onlineText, !participant.isOnline && styles.offlineText]}>
                  {participant.isOnline ? ui.online : ui.offline}
                </Text>
              </View>
            )}
          </View>
        </View>

        {showClearConversation && onClearConversation ? (
          <Pressable
            onPress={handleClearPress}
            disabled={clearLoading}
            style={styles.headerDeleteButton}
            accessibilityLabel={ui.clearConversationA11y}
          >
            {clearLoading ? (
              <ActivityIndicator size="small" color={AppColors.status.error} />
            ) : (
              <Ionicons name="trash-outline" size={22} color={AppColors.status.error} />
            )}
          </Pressable>
        ) : null}
      </View>

      {/* Messages Area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={messagesScrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToLatestMessage}
          onLayout={scrollToLatestMessage}
        >
          {messages.map((msg, index) => (
            <AnimatedMessage key={msg.id} messageId={msg.id}>
              <View
                onLayout={index === messages.length - 1 ? scrollToLatestMessage : undefined}
                style={[
                  styles.messageBubble,
                  msg.isFromOther ? styles.otherBubble : styles.userBubble,
                ]}
              >
                {msg.emoji && !msg.isFromOther && (
                  <Text style={styles.messageEmoji}>{msg.emoji}</Text>
                )}
                <Text
                  style={[
                    styles.messageText,
                    msg.isFromOther ? styles.otherMessageText : styles.userMessageText,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
              
              {/* Renderiza botões de opções se existirem */}
              {msg.options && msg.options.length > 0 && msg.isFromOther && (
                <View style={styles.optionsContainer}>
                  {msg.options.map((option, index) => (
                    <AnimatedOptionButton
                      key={option.id}
                      delay={index * 100}
                      onPress={() => {
                        if (onOptionSelect) {
                          onOptionSelect(option);
                        }
                      }}
                    >
                      <Text style={styles.optionText}>
                        {option.emoji && `${option.emoji} `}
                        {option.label}
                      </Text>
                    </AnimatedOptionButton>
                  ))}
                </View>
              )}
            </AnimatedMessage>
          ))}
        </ScrollView>

        {/* Input Area */}
        {canSendMessages && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={ui.inputPlaceholder}
              placeholderTextColor={AppColors.text.tertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <Pressable
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={message.trim() ? AppColors.text.white : AppColors.text.tertiary}
              />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerDeleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.gray[200],
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.gray[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    color: AppColors.text.white,
    fontWeight: '700',
  },
  avatarIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIconContainerIptu: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.palette.sky.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantTextInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  offlineDot: {
    backgroundColor: '#9CA3AF',
  },
  onlineText: {
    fontSize: 12,
    color: '#22C55E',
  },
  offlineText: {
    color: '#9CA3AF',
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.background.default,
    borderBottomLeftRadius: 4,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#14B8A6',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  otherMessageText: {
    color: AppColors.text.secondary,
  },
  userMessageText: {
    color: AppColors.text.white,
  },
  messageEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  // Options
  optionsContainer: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    marginBottom: 12,
    gap: 8,
  },
  optionButton: {
    backgroundColor: AppColors.background.default,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.text.secondary,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.background.default,
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: AppColors.background.light,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    color: AppColors.text.secondary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: AppColors.gray[200],
  },
});
