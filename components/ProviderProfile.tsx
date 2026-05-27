import {
  CATEGORIES_WITH_ALL,
  CATEGORIAS_EMPRESAS,
} from '@/constants/providerCategories';
import { AppColors } from '@/constants/theme';
import type { Profile } from '@/types';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type TabId = 'mural' | 'fotos' | 'precos' | 'info';

const MOCK_MURAL_PROVIDER = [
  {
    id: '1',
    timeAgo: 'HÁ 4H',
    text: 'Finalizei agora uma manutenção preventiva em um condomínio no Leblon. Vazamento oculto resolvido!',
    imageUri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop',
    likes: 45,
  },
  {
    id: '2',
    timeAgo: 'HÁ 1 SEMANA',
    text: 'Novo equipamento de geofone digital chegou. Precisão máxima para encontrar vazamentos ocultos.',
    likes: 112,
  },
];

export default function ProviderProfile({ data }: { data: Profile }) {
  const [activeTab, setActiveTab] = useState<TabId>('mural');
  const [imageError, setImageError] = useState(false);

  const isCompany = data.type === 'COMPANY';
  const professionLabel = isCompany
    ? (CATEGORIAS_EMPRESAS.find((c) => c.id === data.categoryId)?.label ?? '')
    : (CATEGORIES_WITH_ALL.find((c) => c.id === data.categoryId)?.label ?? '');
  const professionPill = professionLabel
    ? (isCompany ? data.categoryId.toUpperCase() : professionLabel.toUpperCase())
    : '';

  const showFallback = !data?.image || imageError;

  const tabs: { id: TabId; label: string; icon: string; iconColor: string }[] = [
    { id: 'mural', label: 'MURAL SOCIAL', icon: 'people', iconColor: '#1E3A8A' },
    { id: 'fotos', label: 'FOTOS & VÍDEOS', icon: 'images', iconColor: '#DC2626' },
    { id: 'precos', label: 'TABELA PREÇOS', icon: 'pricetag', iconColor: '#16A34A' },
    { id: 'info', label: 'INFORMAÇÕES', icon: 'information-circle', iconColor: '#EA580C' },
  ];

  return (
    <View style={styles.container}>
      {/* Header: back, heart, share */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={AppColors.text.secondary} />
        </Pressable>
        <View style={styles.topBarRight}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="heart-outline" size={24} color={AppColors.text.secondary} />
          </Pressable>
          <Pressable style={styles.iconButton}>
            <Ionicons name="share-outline" size={24} color={AppColors.text.secondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
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
            {!isCompany && (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera-outline" size={14} color="#fff" />
              </View>
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
              <Text style={styles.ratingText}>{data.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={isActive ? '#fff' : tab.iconColor}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content by tab */}
        {activeTab === 'mural' && (
          <View style={styles.muralList}>
            {(data.muralPosts ?? MOCK_MURAL_PROVIDER).map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  {showFallback ? (
                    <View style={styles.postAvatar}>
                      <Text style={styles.postAvatarText}>{data.name.charAt(0)}</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: data.image }} style={styles.postAvatarImg} />
                  )}
                  <View style={styles.postMeta}>
                    <Text style={styles.postAuthor}>{data.name}</Text>
                    <Text style={styles.postTime}>{post.timeAgo}</Text>
                  </View>
                </View>
                <Text style={styles.postText}>{post.text}</Text>
                {post.imageUri && (
                  <Image source={{ uri: post.imageUri }} style={styles.postImage} />
                )}
                <View style={styles.postActions}>
                  <View style={styles.postActionItem}>
                    <Feather name="heart" size={18} color={AppColors.text.tertiary} />
                    <Text style={styles.postActionText}>{post.likes}</Text>
                  </View>
                  <View style={styles.postActionItem}>
                    <Feather name="share-2" size={18} color={AppColors.text.tertiary} />
                    <Text style={styles.postActionText}>Compartilhar</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'fotos' && (
          <View style={styles.tabContent}>
            <Text style={styles.galleryTitle}>GALERIA</Text>
            {data.gallery && data.gallery.length > 0 ? (
              <View style={styles.galleryGrid}>
                {data.gallery.map((uri, i) => (
                  <View key={i} style={styles.galleryGridItem}>
                    <Image source={{ uri }} style={styles.galleryGridImage} />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyTabText}>Nenhuma foto ou vídeo ainda.</Text>
            )}
          </View>
        )}

        {activeTab === 'precos' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionRow}>
              <Ionicons name="pricetag" size={20} color="#16A34A" />
              <Text style={styles.sectionTitle}>SERVIÇOS E VALORES</Text>
            </View>
            {data.services && data.services.length > 0 ? (
              <>
                {data.services.map((srv, i) => (
                  <View key={i} style={styles.serviceItem}>
                    <View style={styles.serviceHeader}>
                      <Text style={styles.serviceName}>{srv.name}</Text>
                      <Text style={styles.servicePrice}>{srv.price}</Text>
                    </View>
                    <Text style={styles.serviceDesc}>{srv.description}</Text>
                  </View>
                ))}
                <Text style={styles.priceDisclaimer}>
                  Orçamento sem compromisso. Valores sujeitos a alteração conforme o serviço.
                </Text>
              </>
            ) : (
              <Text style={styles.emptyTabText}>Tabela de preços em breve.</Text>
            )}
          </View>
        )}

        {activeTab === 'info' && (
          <View style={styles.tabContent}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={22} color="#EA580C" />
              <Text style={styles.infoLabel}>SOBRE</Text>
            </View>
            <Text style={styles.aboutText}>{data.about}</Text>

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

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Avaliações</Text>
            <Text style={styles.reviewsCount}>({data.review} avaliações)</Text>
            {data.reviews.length > 0 &&
              data.reviews.map((r, i) => (
                <View key={i} style={styles.reviewItem}>
                  <Text style={styles.reviewAuthor}>{r.author}</Text>
                  <Text style={styles.reviewComment}>{r.comment}</Text>
                </View>
              ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.btnLigar}
          activeOpacity={0.85}
          onPress={() => {
            const tel = data.phone?.replace(/\D/g, '');
            if (tel) Linking.openURL(`tel:${tel}`);
          }}
        >
          <Ionicons name="call-outline" size={22} color="#7C3AED" />
          <Text style={styles.btnLigarText}>LIGAR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnChat}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/ChatTab',
              params: { provider: JSON.stringify(data) },
            })
          }
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#EAB308" />
          <Text style={styles.btnChatText}>INICIAR CHAT</Text>
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
  iconButton: {
    padding: 8,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
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
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
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
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: AppColors.background.light,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    minWidth: '47%',
  },
  tabActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.gray[700],
  },
  tabLabelActive: {
    color: '#fff',
  },
  muralList: {
    gap: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.palette.indigo.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  postAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.palette.indigo.base,
  },
  postAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postMeta: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  postTime: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginTop: 2,
  },
  postText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: AppColors.gray[200],
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  postActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    minHeight: 120,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
  priceDisclaimer: {
    fontSize: 12,
    color: AppColors.gray[500],
    fontStyle: 'italic',
    marginTop: 8,
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
  infoValue: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 4,
  },
  emptyTabText: {
    fontSize: 15,
    color: AppColors.gray[500],
  },
  galleryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryGridItem: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: AppColors.gray[200],
  },
  galleryGridImage: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  reviewsCount: {
    fontSize: 13,
    color: AppColors.gray[500],
    marginBottom: 12,
  },
  reviewItem: {
    marginBottom: 12,
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 80,
  },
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
