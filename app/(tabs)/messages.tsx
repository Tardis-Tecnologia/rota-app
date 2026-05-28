import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, useConversations } from '@/contexts/ConversationsContext';
import { mockSystemConversations } from '@/data/mockConversations';
import { getAuthToken, getWhitelabelHostId } from '@/services/authApi';
import { resolveChatPeerPhotoMap } from '@/services/chatPeerPhotos';
import { ensureStreamChatConnected } from '@/services/streamChatApi';
import {
  effectiveStreamLastMessage,
  getStreamChannelClearedMap,
} from '@/services/streamChatClearStore';
import { resolveStreamConversationDisplay } from '@/utils/streamChatPeer';
import { streamAndUiDisplayName } from '@/utils/userDisplayName';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
  lastMessageAt: number;
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

function hasUnreadMessages(conversation: ConversationCardItem): boolean {
  return (conversation.unreadCount ?? 0) > 0;
}

function sortStreamConversationsByRecent(items: StreamConversation[]): StreamConversation[] {
  return [...items].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

/** Assistentes virtuais (mock) — só na caixa do cidadão. */
const systemAssistantConversations = mockSystemConversations;

const MOCK_CHAT_PROVIDER_IDS = new Set([
  'saude',
  'defesa-civil',
  'iptu',
  'comunicados-oficiais',
]);

type MensagensScreenProps = {
  /** Caixa da loja: só comunicados oficiais + chats reais com cidadãos. */
  variant?: 'citizen' | 'commercial';
};

function shouldShowStreamChannelForCommercialInbox(
  channel: { data?: Record<string, unknown> | null },
  peerId: string,
): boolean {
  const data = channel.data;
  if (data?.commercial_store_contact === true) {
    return true;
  }
  const pid = peerId.trim();
  if (!pid || pid.startsWith('commercial:')) {
    return false;
  }
  if (MOCK_CHAT_PROVIDER_IDS.has(pid)) {
    return false;
  }
  return true;
}

export default function MensagensScreen({ variant = 'citizen' }: MensagensScreenProps) {
  const isCommercialInbox = variant === 'commercial';
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
    (
      channel: any,
      clearedAtByCid: Record<string, string>,
      streamUserId: string,
    ): StreamConversation => {
      const display = resolveStreamConversationDisplay({
        members: channel.state?.members,
        currentUserId: streamUserId,
        channelName: channel?.data?.name,
        channelImage: channel?.data?.image,
        fallbackId: channel.id || channel.cid,
      });
      const clearedAtRaw = clearedAtByCid[channel.cid];
      const clearedAt = clearedAtRaw ? new Date(clearedAtRaw) : null;
      const lastMessage = effectiveStreamLastMessage(channel.state?.messages ?? [], clearedAt);
      const unreadCount = typeof channel.countUnread === 'function' ? channel.countUnread() : 0;
      const lastMessageAtRaw = channel.state?.last_message_at;
      const lastMessageAt = lastMessageAtRaw
        ? new Date(lastMessageAtRaw).getTime()
        : 0;

      return {
        id: channel.cid,
        providerId: display.id,
        providerName: display.name,
        providerImage: display.image || '',
        lastMessage,
        date: formatMessageDate(lastMessageAtRaw),
        lastMessageAt: Number.isFinite(lastMessageAt) ? lastMessageAt : 0,
        unreadCount,
        providerData: {
          id: display.id,
          name: display.name,
          image: display.image,
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
    if (user.profile === 'VISITANTE') {
      setConversations([]);
      setLoadError(null);
      setIsLoading(false);
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
      const displayName = streamAndUiDisplayName(user);
      const client = await ensureStreamChatConnected(user.id, displayName);
      const streamUserId = client.userID?.trim() || user.id;

      const clearedAtByCid = await getStreamChannelClearedMap(user.id);

      const hostId = getWhitelabelHostId();
      const channels = await client.queryChannels(
        {
          type: 'messaging',
          members: { $in: [streamUserId] },
          whitelabel_host_id: hostId,
        },
        [{ last_message_at: -1 }],
        {
          watch: true,
          state: true,
        },
      );

      const built = channels
        .filter((channel) => {
          if (!isCommercialInbox) return true;
          const peerId = resolveStreamConversationDisplay({
            members: channel.state?.members,
            currentUserId: streamUserId,
            channelName: channel?.data?.name,
            channelImage: channel?.data?.image,
            fallbackId: channel.id || channel.cid,
          }).id;
          return shouldShowStreamChannelForCommercialInbox(channel, peerId);
        })
        .map((channel) =>
          buildConversationFromChannel(channel, clearedAtByCid, streamUserId),
        );
      const photoMap = await resolveChatPeerPhotoMap(built.map((c) => c.providerId));
      const withPhotos = built.map((conversation) => {
        const photo = photoMap.get(conversation.providerId);
        if (!photo) return conversation;
        return {
          ...conversation,
          providerImage: photo,
          providerData: { ...conversation.providerData, image: photo },
        };
      });
      setConversations(sortStreamConversationsByRecent(withPhotos));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar as conversas.');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    buildConversationFromChannel,
    isCommercialInbox,
    user?.id,
    user?.name,
    user?.email,
    user?.profile,
  ]);

  const assistantConversations = isCommercialInbox ? [] : systemAssistantConversations;

  useFocusEffect(
    useCallback(() => {
      void loadStreamConversations();
    }, [loadStreamConversations]),
  );

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
        ...(isCommercialInbox ? { returnTo: '/comerciante/mensagens' } : {}),
      },
    });
  };

  const renderConversationCard = (conversation: ConversationCardItem, isFixed = false) => {
    const showFallback = !conversation.providerImage || imageErrors[conversation.id] || conversation.providerImage === '';
    const isOfficial = conversation.providerId === 'comunicados-oficiais';
    const isIPTU = conversation.providerId === 'iptu';
    const showUnreadDot = hasUnreadMessages(conversation);
    
    // Layout especial para Comunicados Oficiais
    if (isOfficial) {
      return (
        <Pressable
          key={conversation.id}
          style={styles.officialCard}
          onPress={() => handleOpenChat(conversation)}
        >
          {showUnreadDot ? <View style={styles.unreadDotCorner} /> : null}
          <View style={styles.officialIconWrap}>
            <View style={styles.officialIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color={AppColors.text.white} />
            </View>
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
            <Text style={styles.name} numberOfLines={1}>
              {conversation.providerName}
            </Text>
            <View style={styles.timeMetaColumn}>
              {conversation.date ? (
                <Text style={[styles.date, styles.dateMeta]}>{conversation.date}</Text>
              ) : null}
              {showUnreadDot ? <View style={styles.unreadDotBelowTime} /> : null}
            </View>
          </View>
          <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
            {conversation.lastMessage}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Comunicados Oficiais — sempre no topo */}
        {fixedConversations.length > 0 && (
          <View style={styles.list}>
            {fixedConversations.map((conversation) => renderConversationCard(conversation, true))}
          </View>
        )}

        {isLoading && (
          <View style={[styles.inlineHint, fixedConversations.length > 0 && styles.commonList]}>
            <Text style={styles.inlineHintText}>A carregar conversas em tempo real…</Text>
          </View>
        )}

        {loadError && !isLoading && (
          <View style={[styles.inlineHint, fixedConversations.length > 0 && styles.commonList]}>
            <Text style={styles.loadErrorText}>Não foi possível carregar chats do Stream</Text>
            <Text style={styles.inlineHintText}>{loadError}</Text>
          </View>
        )}

        {/* Conversas reais (Stream) — mais recentes primeiro, acima dos mocks */}
        {conversations.length > 0 && (
          <View style={fixedConversations.length > 0 ? styles.commonList : undefined}>
            <Text style={styles.sectionLabel}>Conversas mais recentes</Text>
            <View style={styles.list}>
              {conversations.map((conversation) => renderConversationCard(conversation, false))}
            </View>
          </View>
        )}

        {assistantConversations.length > 0 && (
          <View
            style={[
              styles.list,
              (fixedConversations.length > 0 || conversations.length > 0) && styles.commonList,
            ]}
          >
            {assistantConversations.map((conversation) =>
              renderConversationCard(conversation, false),
            )}
          </View>
        )}

        {!isLoading &&
          !loadError &&
          fixedConversations.length === 0 &&
          assistantConversations.length === 0 &&
          conversations.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma conversa ainda</Text>
              <Text style={styles.emptyStateSubtext}>Suas conversas aparecerão aqui</Text>
            </View>
          )}
      </ScrollView>

      <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={() => void loadStreamConversations()}>
        <MaterialCommunityIcons name="whatsapp" size={28} color={AppColors.text.white} />
      </TouchableOpacity>

      <VisitanteLoginOverlay message="As mensagens e o atendimento ficam disponíveis após o login com uma conta cadastrada." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: AppColors.background.default,
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.text.tertiary,
    letterSpacing: 0.2,
    marginBottom: 10,
    paddingHorizontal: 4,
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
  inlineHint: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  inlineHintText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  loadErrorText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
    marginBottom: 4,
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
    position: 'relative',
    overflow: 'visible',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: AppColors.background.default,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 2,
    borderColor: AppColors.primaryDark,
  },
  unreadDotCorner: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.whatsapp,
    borderWidth: 2,
    borderColor: AppColors.background.default,
    zIndex: 2,
  },
  timeMetaColumn: {
    position: 'relative',
    alignItems: 'flex-end',
    minWidth: 44,
    marginLeft: 8,
    overflow: 'visible',
  },
  dateMeta: {
    textAlign: 'right',
  },
  unreadDotBelowTime: {
    position: 'absolute',
    top: 20,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.whatsapp,
  },
  officialIconWrap: {
    justifyContent: 'center',
    alignSelf: 'stretch',
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
    gap: 8,
  },
  nameWithBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  verifyIcon: {
    marginLeft: 4,
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

