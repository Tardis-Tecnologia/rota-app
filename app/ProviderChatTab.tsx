import { AppColors } from '@/constants/theme';
import { useConversations } from '@/contexts/ConversationsContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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

type Message = {
  id: string;
  text: string;
  isProvider: boolean;
  timestamp: Date;
};

export default function ProviderChatTab() {
  const { provider } = useLocalSearchParams();
  const data = JSON.parse(provider as string);
  const { addOrUpdateConversation } = useConversations();

  const initialMessage = `Olá! Você iniciou uma conversa com ${data.name}. Como posso te ajudar hoje?`;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: initialMessage,
      isProvider: true,
      timestamp: new Date(),
    },
  ]);

  const [imageError, setImageError] = useState(false);

  // Save conversation when entering the chat
  useEffect(() => {
    addOrUpdateConversation(data, initialMessage);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const showFallback = !data?.image || imageError || data.image === '';

  const handleBack = () => {
    // Get the last message to save
    const lastMessage = messages[messages.length - 1];
    addOrUpdateConversation(data, lastMessage.text);
    
    // Navigate to messages tab
    router.replace('/(tabs)/messages');
  };

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        isProvider: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
        </Pressable>

        <View style={styles.providerInfo}>
          {showFallback ? (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{getInitials(data.name)}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: data.image }}
              style={styles.avatar}
              onError={() => setImageError(true)}
            />
          )}
          <View style={styles.providerTextInfo}>
            <Text style={styles.providerName} numberOfLines={1}>
              {data.name}
            </Text>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages Area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.isProvider ? styles.providerBubble : styles.userBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.isProvider ? styles.providerMessageText : styles.userMessageText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
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
  providerInfo: {
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
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  providerTextInfo: {
    flex: 1,
  },
  providerName: {
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
  onlineText: {
    fontSize: 12,
    color: '#22C55E',
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  providerBubble: {
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
  providerMessageText: {
    color: AppColors.text.secondary,
  },
  userMessageText: {
    color: AppColors.text.white,
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

