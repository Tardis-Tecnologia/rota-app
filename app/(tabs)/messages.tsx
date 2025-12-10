import { AppColors } from '@/constants/theme';
import { useConversations } from '@/contexts/ConversationsContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MensagensScreen() {
  const { conversations, fixedConversations } = useConversations();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleOpenChat = (conversation: typeof conversations[0]) => {
    router.push({
      pathname: '/ChatTab',
      params: {
        provider: JSON.stringify(conversation.providerData),
      },
    });
  };

  const renderConversationCard = (conversation: typeof conversations[0], isFixed = false) => {
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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Chats Fixos */}
        {fixedConversations.length > 0 && (
          <View style={styles.list}>
            {fixedConversations.map((conversation) => renderConversationCard(conversation, true))}
          </View>
        )}

        {/* Chats Comuns */}
        {conversations.length > 0 ? (
          <View style={[styles.list, fixedConversations.length > 0 && styles.commonList]}>
            {conversations.map((conversation) => renderConversationCard(conversation, false))}
          </View>
        ) : fixedConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhuma conversa ainda</Text>
            <Text style={styles.emptyStateSubtext}>Suas conversas aparecerão aqui</Text>
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={() => {}}>
        <MaterialCommunityIcons name="whatsapp" size={28} color={AppColors.text.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
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

