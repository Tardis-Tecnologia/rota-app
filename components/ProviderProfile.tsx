import ProviderRatingSection from '@/components/guia/ProviderRatingSection';
import {
  CATEGORIES_WITH_ALL,
  CATEGORIAS_EMPRESAS,
} from '@/constants/providerCategories';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { prepareServiceProviderChat } from '@/services/serviceProviderChat';
import type { Profile } from '@/types';
import type { ServiceProviderUserRating } from '@/types/serviceProvider';
import { formatProviderRatingLabel } from '@/utils/providerRatingDisplay';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  const [imageError, setImageError] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const isCompany = data.type === 'COMPANY';
  const isOwner = !!user?.id && !!data.ownerUserId && data.ownerUserId === user.id;
  const professionLabel = isCompany
    ? (CATEGORIAS_EMPRESAS.find((c) => c.id === data.categoryId)?.label ?? '')
    : (CATEGORIES_WITH_ALL.find((c) => c.id === data.categoryId)?.label ?? '');
  const professionPill = professionLabel
    ? (isCompany ? data.categoryId.toUpperCase() : professionLabel.toUpperCase())
    : '';

  const showFallback = !data?.image || imageError;
  const renderedServices = useMemo(
    () =>
      data.services && data.services.length > 0
        ? data.services
        : [
            {
              name: professionLabel || data.categoryId || 'Serviço',
              description: data.about || 'Detalhes do serviço não informados.',
              price: 'A combinar',
            },
          ],
    [data.about, data.categoryId, data.services, professionLabel],
  );

  const openProviderChat = async () => {
    if (!data.ownerUserId?.trim()) {
      router.push({
        pathname: '/ChatTab',
        params: { provider: JSON.stringify(data) },
      });
      return;
    }
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
        providerCategoryLabel: professionLabel || data.categoryId,
        providerImage: data.image || undefined,
        currentUserDisplayName: user.name,
      });
      router.push({
        pathname: '/ChatTab',
        params: { provider: JSON.stringify(payload) },
      });
    } catch (e) {
      Alert.alert(
        'Erro',
        e instanceof Error ? e.message : 'Não foi possível abrir a conversa.',
      );
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
            {professionPill ? (
              <View style={styles.professionPill}>
                <Text style={styles.professionPillText}>{professionPill}</Text>
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
              <Text style={styles.serviceDesc}>{srv.description}</Text>
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
  professionPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
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
