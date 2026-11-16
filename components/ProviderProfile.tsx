import ProviderRatingSection from '@/components/guia/ProviderRatingSection';
import {
  CATEGORIES_WITH_ALL,
  CATEGORIAS_EMPRESAS,
} from '@/constants/providerCategories';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/contexts/ConversationsContext';
import { prepareServiceProviderChat } from '@/services/serviceProviderChat';
import type { Profile } from '@/types';
import type { ServiceProviderUserRating } from '@/types/serviceProvider';
import { ROUTE_CITIZEN_MESSAGES } from '@/utils/comercioAuth';
import { formatProviderRatingLabel } from '@/utils/providerRatingDisplay';
import {
  categoryIdToLabel,
  formatCategoriesLabel,
} from '@/utils/serviceProviderCategories';
import { streamAndUiDisplayName } from '@/utils/userDisplayName';
import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ProviderProfileProps = {
  data: Profile;
  canRate?: boolean;
  providerId?: string;
  userRating?: ServiceProviderUserRating | null;
  onRatingUpdated?: (payload: {
    ratingAverage: number;
    ratingCount: number;
    userRating: ServiceProviderUserRating;
  }) => void;
};

export default function ProviderProfile({
  data,
  canRate = false,
  providerId,
  userRating,
  onRatingUpdated,
}: ProviderProfileProps) {
  const { user } = useAuth();
  const { addOrUpdateConversation } = useConversations();
  const [imageError, setImageError] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const isCompany = data.type === 'COMPANY';
  const isOwner = !!user?.id && !!data.ownerUserId && data.ownerUserId === user.id;
  const professionLabels = useMemo(() => {
    if (isCompany) {
      const label =
        CATEGORIAS_EMPRESAS.find((c) => c.id === data.categoryId)?.label ?? data.categoryId;
      return label ? [label] : [];
    }
    const ids = data.categoryIds?.length ? data.categoryIds : data.categoryId ? [data.categoryId] : [];
    return ids.map((id) => categoryIdToLabel(id));
  }, [data.categoryId, data.categoryIds, isCompany]);

  const professionSummary = professionLabels.join(' · ');
  const categoriesDisplayLabel =
    !isCompany && professionLabels.length > 0
      ? formatCategoriesLabel(data.categoryIds ?? [data.categoryId])
      : professionSummary;

  const showFallback = !data?.image || imageError;
  const renderedServices = useMemo(() => {
    const fallbackDescription =
      professionLabels.length <= 1
        ? data.about || 'Detalhes do serviço não informados.'
        : '';
    if (data.services && data.services.length > 0) {
      if (professionLabels.length <= 1) return data.services;
      return data.services.map((srv) => ({ ...srv, description: '' }));
    }
    if (professionLabels.length > 0) {
      return professionLabels.map((name) => ({
        name,
        description: fallbackDescription,
        price: 'A combinar',
      }));
    }
    return [
      {
        name: data.categoryId || 'Serviço',
        description: data.about || 'Detalhes do serviço não informados.',
        price: 'A combinar',
      },
    ];
  }, [data.about, data.categoryId, data.services, professionLabels]);

  const openProviderChat = async () => {
    if (!user?.id) {
      Alert.alert('Login necessário', 'Faça login para enviar mensagem ao prestador.');
      return;
    }
    if (user.profile === 'VISITANTE') {
      Alert.alert(
        'Conta necessária',
        'Visitantes não podem enviar mensagens. Faça login com uma conta cadastrada.',
      );
      return;
    }
    if (!data.ownerUserId?.trim()) {
      Alert.alert(
        'Chat indisponível',
        'Este prestador ainda não tem conta para mensagens no app.',
      );
      return;
    }
    if (data.ownerUserId === user.id) {
      Alert.alert('Indisponível', 'Você não pode iniciar conversa com o seu próprio perfil.');
      return;
    }

    setChatLoading(true);
    try {
      const payload = await prepareServiceProviderChat({
        currentUserId: user.id,
        providerOwnerUserId: data.ownerUserId,
        providerName: data.name,
        providerCategoryLabel: categoriesDisplayLabel || data.categoryId,
        providerImage: data.image || undefined,
        currentUserDisplayName: streamAndUiDisplayName(user) ?? user.name,
      });
      addOrUpdateConversation(payload, payload.draftMessage || `Conversa com ${payload.name}`);
      router.push({
        pathname: '/ChatTab',
        params: {
          provider: JSON.stringify(payload),
          returnTo: '/(tabs)/messages',
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível abrir a conversa.';
      Alert.alert('Chat', msg, [
        {
          text: 'Abrir Mensagens',
          onPress: () => router.push(ROUTE_CITIZEN_MESSAGES as Href),
        },
        { text: 'OK', style: 'cancel' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const goEditProfile = () => {
    router.push({
      pathname: '/guia/cadastro-prestador',
      params: { providerId: data.id },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
        </Pressable>
        {isOwner ? (
          <Pressable onPress={goEditProfile} style={styles.iconButton}>
            <Ionicons name="create-outline" size={24} color={AppColors.text.secondary} />
          </Pressable>
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {showFallback ? (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{data.name.charAt(0)}</Text>
              </View>
            ) : (
              <Image
                source={{ uri: data.image }}
                style={styles.avatar}
                onError={() => setImageError(true)}
              />
            )}
          </View>
          <Text style={styles.name}>{data.name}</Text>
          <View style={styles.pillRow}>
            {!isCompany && professionLabels.length > 0 ? (
              <View style={styles.professionPillsWrap}>
                {professionLabels.map((label, index) => (
                  <View
                    key={`${label}-${index}`}
                    style={[styles.professionPill, index === 0 && styles.professionPillPrimary]}
                  >
                    <Text style={styles.professionPillText}>{label.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            ) : isCompany && professionLabels[0] ? (
              <View style={styles.professionPill}>
                <Text style={styles.professionPillText}>
                  {data.categoryId.toUpperCase()}
                </Text>
              </View>
            ) : null}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#EAB308" />
              <Text style={styles.ratingText}>
                {formatProviderRatingLabel(data.rating, data.review)}
              </Text>
            </View>
          </View>

          {canRate && providerId && onRatingUpdated ? (
            <ProviderRatingSection
              providerId={providerId}
              ratingAverage={data.rating}
              ratingCount={data.review}
              userRating={userRating}
              onRatingUpdated={onRatingUpdated}
            />
          ) : null}
        </View>

        <View style={styles.tabContent}>
          <View style={styles.sectionRow}>
            <Ionicons name="pricetag" size={20} color="#16A34A" />
            <Text style={styles.sectionTitle}>SERVIÇOS E VALORES (CADASTRO)</Text>
          </View>
          {renderedServices.map((srv, i) => (
            <View key={i} style={styles.serviceItem}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{srv.name}</Text>
                <Text style={styles.servicePrice}>{srv.price}</Text>
              </View>
              {srv.description?.trim() ? (
                <Text style={styles.serviceDesc}>{srv.description}</Text>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.tabContent}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={22} color="#EA580C" />
            <Text style={styles.infoLabel}>INFORMAÇÕES</Text>
          </View>
          <Text style={styles.aboutText}>{data.about || 'Sem descrição cadastrada.'}</Text>

          {data.address ? (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={22} color="#6D28D9" />
                <Text style={styles.infoLabel}>ENDEREÇO</Text>
              </View>
              <Text style={styles.infoValue}>{data.address}</Text>
            </>
          ) : null}

          {data.serviceArea ? (
            <>
              <View style={styles.infoRow}>
                <Ionicons
                  name={data.address ? 'map-outline' : 'location'}
                  size={22}
                  color="#6D28D9"
                />
                <Text style={styles.infoLabel}>
                  {data.address ? 'ÁREA DE ATENDIMENTO' : 'LOCALIZAÇÃO'}
                </Text>
              </View>
              <Text style={styles.infoValue}>{data.serviceArea}</Text>
            </>
          ) : null}

          {data.hours ? (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="time" size={22} color="#6D28D9" />
                <Text style={styles.infoLabel}>HORÁRIO</Text>
              </View>
              <Text style={styles.infoValue}>{data.hours}</Text>
            </>
          ) : null}

          {data.phone ? (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="call" size={22} color="#6D28D9" />
                <Text style={styles.infoLabel}>TELEFONE</Text>
              </View>
              <Text style={styles.infoValue}>{data.phone}</Text>
            </>
          ) : null}

          {data.email ? (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={22} color="#6D28D9" />
                <Text style={styles.infoLabel}>E-MAIL</Text>
              </View>
              <Text style={styles.infoValue}>{data.email}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.btnLigar}
          activeOpacity={0.85}
          onPress={() => {
            const tel = data.phone?.replace(/\D/g, '');
            if (tel) void Linking.openURL(`tel:${tel}`);
          }}
        >
          <Ionicons name="call-outline" size={22} color="#7C3AED" />
          <Text style={styles.btnLigarText}>LIGAR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnChat}
          activeOpacity={0.85}
          onPress={() => void openProviderChat()}
          disabled={chatLoading || isOwner}
        >
          {chatLoading ? (
            <ActivityIndicator size="small" color="#EAB308" />
          ) : (
            <Ionicons name="chatbubble-ellipses" size={22} color="#EAB308" />
          )}
          <Text style={styles.btnChatText}>
            {isOwner ? 'SEU PERFIL' : chatLoading ? 'ABRINDO...' : 'INICIAR CHAT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.gray[300],
  },
  iconButton: { padding: 8 },
  iconButtonPlaceholder: { width: 40, height: 40 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
    gap: 12,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: AppColors.palette.indigo.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 32,
    fontWeight: '700',
    color: AppColors.palette.indigo.base,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  professionPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  professionPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  professionPillPrimary: {
    backgroundColor: '#DDD6FE',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  professionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  serviceItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.gray[300],
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 8,
  },
  serviceDesc: {
    fontSize: 13,
    color: AppColors.gray[600],
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  aboutText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  infoValue: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 4,
  },
  bottomSpacer: { height: 80 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.gray[300],
  },
  btnLigar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#7C3AED',
    backgroundColor: '#fff',
  },
  btnLigarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },
  btnChat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#1E3A8A',
  },
  btnChatText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
