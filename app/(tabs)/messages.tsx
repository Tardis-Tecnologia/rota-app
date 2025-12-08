import { AppColors } from '@/constants/theme';
import { useConversations } from '@/contexts/ConversationsContext';
import { MaterialIcons } from '@expo/vector-icons';
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

const messages = [
  {
    id: 1,
    name: 'Ouvidoria',
    message: 'Sua solicitação (Protocolo #2025-A4B8) foi recebida com sucesso!',
    date: 'ontem',
    imgUrl: 'https://i.pravatar.cc/150?u=ouvidoria'
  },
  {
    id: 2,
    name: 'Secretaria de Saúde',
    message: 'Campanha de vacinação contra a gripe começa na próxima semana. Veja os postos.',
    date: '2d atrás',
    imgUrl: 'https://i.pravatar.cc/150?u=saude'
  },
  {
    id: 3,
    name: 'Defesa Civil',
    message: 'Alerta de chuvas fortes para os próximos dias. Evite áreas de risco.',
    date: '5d atrás',
    imgUrl: 'https://i.pravatar.cc/150?u=defesa-civil'
  }
];

export default function MensagensScreen() {
  const { conversations } = useConversations();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleOpenChat = (conversation: typeof conversations[0]) => {
    router.push({
      pathname: '/ProviderChatTab',
      params: {
        provider: JSON.stringify(conversation.providerData),
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Provider Conversations */}
        {conversations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prestadores de Serviço</Text>
            <View style={styles.list}>
              {conversations.map((conversation) => {
                const showFallback = !conversation.providerImage || imageErrors[conversation.id] || conversation.providerImage === '';
                return (
                  <Pressable
                    key={conversation.id}
                    style={styles.card}
                    onPress={() => handleOpenChat(conversation)}
                  >
                    {showFallback ? (
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
                      <Text style={styles.message} numberOfLines={2}>
                        {conversation.lastMessage}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* System Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações</Text>
          <View style={styles.list}>
            {messages.map((message) => (
              <View key={message.id} style={styles.card}>
                <Image source={{ uri: message.imgUrl }} style={styles.avatar} />

                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.name}>{message.name}</Text>
                    <Text style={styles.date}>{message.date}</Text>
                  </View>
                  <Text style={styles.message} numberOfLines={2}>{message.message}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={() => {}}>
        <MaterialIcons name="send" size={28} color={AppColors.text.white} style={{ transform: [{ rotate: "-35deg" }] }}/>
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
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  list: {
    gap: 12,
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
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.secondary,
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
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});

