import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { Conversation, useConversations } from '@/contexts/ConversationsContext';
import { getApiBaseUrl, getAuthToken } from '@/services/authApi';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StreamChat } from 'stream-chat';

type StreamConversation = {
  id: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  lastMessage: string;
  date: string;
  providerData: {
    id: string;
    name: string;
    image?: string;
    channelId: string;
    channelType: string;
    cid: string;
  };
  unreadCount?: number;
};
type ConversationCardItem = Conversation | StreamConversation;

export default function MensagensScreen() {
  const { backgroundColor } = useAppTheme();
  const { user } = useAuth();
  const { fixedConversations } = useConversations();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [conversations, setConversations] = useState<StreamConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const formatMessageDate = (dateInput?: string | Date | null) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const buildConversationFromChannel = useCallback(
    (channel: any): StreamConversation => {
      const members = Object.values(channel.state?.members ?? {}) as Array<any>;
      const otherMember = members.find((member) => member?.user?.id !== user?.id);
      const channelName = channel?.data?.name || otherMember?.user?.name || `Canal ${channel.id || ''}`;
      const lastMessage =
        channel.state?.messages?.[channel.state.messages.length - 1]?.text || 'Sem mensagens ainda';
      const unreadCount = typeof channel.countUnread === 'function' ? channel.countUnread() : 0;

      return {
        id: channel.cid,
        providerId: channel.id || channel.cid,
        providerName: channelName,
        providerImage: channel?.data?.image || otherMember?.user?.image || '',
        lastMessage,
        date: formatMessageDate(channel.state?.last_message_at),
        unreadCount,
        providerData: {
          id: channel.id || channel.cid,
          name: channelName,
          image: channel?.data?.image || otherMember?.user?.image || '',
          channelId: channel.id || '',
          channelType: channel.type,
          cid: channel.cid,
        },
      };
    },
    [user?.id],
  );

  const loadStreamConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      return;
    }

    const authToken = getAuthToken();
    if (!authToken) {
      setLoadError('Faça login para carregar as conversas.');
      setConversations([]);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const tokenRes = await fetch(`${getApiBaseUrl()}/api/v1/stream-chat/token`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
      });

      if (!tokenRes.ok) {
        throw new Error(`Falha ao obter token do chat (${tokenRes.status})`);
      }

      const { token, apiKey } = (await tokenRes.json()) as { token: string; apiKey: string };
      const client = StreamChat.getInstance(apiKey);
      await client.connectUser({ id: user.id, name: user.name || undefined }, token);

      const channels = await client.queryChannels(
        { members: { $in: [user.id] } },
        [{ last_message_at: -1 }],
        {
          watch: true,
          state: true,
        },
      );

      setConversations(channels.map(buildConversationFromChannel));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar as conversas.');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildConversationFromChannel, user?.id, user?.name]);

  useEffect(() => {
    void loadStreamConversations();
  }, [loadStreamConversations]);

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleOpenChat = (conversation: ConversationCardItem) => {
    router.push({
      pathname: '/ChatTab',
      params: {
        provider: JSON.stringify(conversation.providerData),
      },
    });
  };

  const renderConversationCard = (conversation: ConversationCardItem, isFixed = false) => {
    const showFallback = !conversation.providerImage || imageErrors[conversation.id] || conversation.providerImage === '';
    const isOfficial = conversation.providerId === 'comunicados-oficiais';
    const isIPTU = conversation.providerId === 'iptu';
    
    // Layout especial para Comunicados Oficiais
    if (isOfficial) {
      return (
        <Pressable
          key={conversation.id}
          style={styles.officialCard}
          onPress={() => handleOpenChat(conversation)}
        >
          <View style={styles.officialIconContainer}>
            <Ionicons name="shield-checkmark" size={24} color={AppColors.text.white} />
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.nameWithBadgeContainer}>
                <Text style={styles.name}>{conversation.providerName}</Text>
                <Ionicons name="checkmark-circle" size={14} color={AppColors.primary} style={styles.verifyIcon} />
              </View>
              <Text style={styles.date}>{conversation.date}</Text>
            </View>
            <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
              {conversation.lastMessage}
            </Text>
          </View>
          
          {conversation.unreadCount && conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
            </View>
          )}
        </Pressable>
      );
    }

    // IPTU e chats comuns - layout normal
    return (
      <Pressable
        key={conversation.id}
        style={styles.card}
        onPress={() => handleOpenChat(conversation)}
      >
        {isIPTU ? (
          <View style={styles.iptuIconContainer}>
            <Ionicons name="receipt" size={24} color={AppColors.primary} />
          </View>
        ) : showFallback ? (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {getInitials(conversation.providerName)}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: conversation.providerImage }}
            style={styles.avatar}
            onError={() => setImageErrors(prev => ({ ...prev, [conversation.id]: true }))}
          />
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{conversation.providerName}</Text>
            <Text style={styles.date}>{conversation.date}</Text>
          </View>
          <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
            {conversation.lastMessage}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Chats Fixos */}
        {fixedConversations.length > 0 && (
          <View style={styles.list}>
            {fixedConversations.map((conversation) => renderConversationCard(conversation, true))}
          </View>
        )}

        {isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateSubtext}>Carregando conversas...</Text>
          </View>
        )}

        {loadError && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Não foi possível carregar o chat</Text>
            <Text style={styles.emptyStateSubtext}>{loadError}</Text>
          </View>
        )}

        {/* Chats Comuns */}
        {!isLoading && !loadError && conversations.length > 0 ? (
          <View style={[styles.list, fixedConversations.length > 0 && styles.commonList]}>
            {conversations.map((conversation) => renderConversationCard(conversation, false))}
          </View>
        ) : !isLoading && !loadError && fixedConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhuma conversa ainda</Text>
            <Text style={styles.emptyStateSubtext}>Suas conversas aparecerão aqui</Text>
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={() => void loadStreamConversations()}>
        <MaterialCommunityIcons name="whatsapp" size={28} color={AppColors.text.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  list: {
    gap: 12,
  },
  commonList: {
    marginTop: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text.secondary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: AppColors.background.default,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  // Card especial para Comunicados Oficiais
  officialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 2,
    borderColor: AppColors.primaryDark,
  },
  officialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  iptuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.palette.sky.light,
    justifyContent: 'center',
    alignItems: 'center',
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
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameWithBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  verifyIcon: {
    marginLeft: 4,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.text.white,
  },
  date: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.text.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.whatsapp,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.whatsapp,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});

