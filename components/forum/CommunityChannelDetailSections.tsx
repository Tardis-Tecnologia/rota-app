import { AppColors } from '@/constants/theme';
import {
  communityCoverUrl,
  parseCommunityCoords,
  type ForumCommunityDetail,
} from '@/services/forumCommunityApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

function roleLabel(role: ForumCommunityDetail['myRole']): string | null {
  if (role === 'OWNER') return 'Dono do canal';
  if (role === 'MEMBER') return 'Participante';
  return null;
}

function membershipLabel(c: ForumCommunityDetail): string | null {
  if (c.isFollowing && !c.isMember) return 'Seguindo';
  return roleLabel(c.myRole);
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatCep(cep: string | null): string | null {
  const digits = (cep ?? '').replace(/\D/g, '');
  if (digits.length !== 8) return cep?.trim() || null;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.chip}>
      <View style={styles.chipIconWrap}>
        <Ionicons name={icon} size={18} color="#0891b2" />
      </View>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.sectionCard, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={18} color="#64748b" />
      <View style={styles.metaBody}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
      ) : null}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.metaPressed}>
        {content}
      </Pressable>
    );
  }
  return content;
}

interface CommunityChannelDetailHeaderProps {
  community: ForumCommunityDetail;
  imageEpoch: number;
  postsCount: number;
  actionButtons: React.ReactNode;
  onOpenMap?: () => void;
}

export function CommunityChannelDetailHeader({
  community,
  imageEpoch,
  postsCount,
  actionButtons,
  onOpenMap,
}: CommunityChannelDetailHeaderProps) {
  const cover = communityCoverUrl(community);
  const coverUri = cover
    ? cover.includes('?')
      ? `${cover}&v=${imageEpoch}`
      : `${cover}?v=${imageEpoch}`
    : null;
  const coords = parseCommunityCoords(community);
  const memberTag = membershipLabel(community);
  const cepFormatted = formatCep(community.cep);
  const creatorName = (community.creator?.name || 'Morador(a)').trim();
  const creatorPhoto = community.creator?.photoUrl?.trim();

  return (
    <View style={styles.headerRoot}>
      <View style={styles.hero}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#0891b2', '#0f766e', '#164e63']} style={styles.heroImage} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(15,23,42,0.85)']}
          style={styles.heroOverlay}
        />
        <View style={styles.heroTopBadges}>
          <View
            style={[
              styles.privacyPill,
              community.privacy === 'PRIVATE' && styles.privacyPillPrivate,
            ]}
          >
            <Ionicons
              name={community.privacy === 'PRIVATE' ? 'lock-closed' : 'earth'}
              size={12}
              color="#fff"
            />
            <Text style={styles.privacyPillText}>
              {community.privacy === 'PRIVATE' ? 'Privada' : 'Pública'}
            </Text>
          </View>
          {community.category ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{community.category}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.heroName} numberOfLines={2}>
            {community.name}
          </Text>
          {memberTag ? (
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{memberTag}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <InfoChip
          icon="people"
          label="Membros"
          value={String(community.membersCount)}
        />
        <InfoChip
          icon="heart"
          label="Seguidores"
          value={String(community.followersCount)}
        />
        <InfoChip icon="newspaper" label="Publicações" value={String(postsCount)} />
      </View>

      {community.description?.trim() ? (
        <SectionCard title="Sobre o canal">
          <Text style={styles.aboutText}>{community.description.trim()}</Text>
        </SectionCard>
      ) : null}

      <SectionCard title="Informações">
        <View style={styles.infoList}>
          {community.creator ? (
            <Pressable
              style={({ pressed }) => [styles.creatorRow, pressed && styles.metaPressed]}
              onPress={() =>
                router.push({
                  pathname: '/forum/author',
                  params: {
                    userId: community.creator!.id,
                    name: community.creator!.name ?? '',
                    photoUrl: community.creator!.photoUrl ?? '',
                  },
                })
              }
            >
              {creatorPhoto ? (
                <Image source={{ uri: creatorPhoto }} style={styles.creatorAvatar} />
              ) : (
                <View style={styles.creatorAvatarPlaceholder}>
                  <Text style={styles.creatorInitial}>
                    {creatorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.creatorText}>
                <Text style={styles.metaLabel}>Criado por</Text>
                <Text style={styles.metaValue}>{creatorName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
            </Pressable>
          ) : null}

          <MetaRow
            icon="calendar-outline"
            label="Canal criado em"
            value={formatCreatedAt(community.createdAt)}
          />

          <MetaRow
            icon="megaphone-outline"
            label="Quem pode publicar"
            value={
              community.privacy === 'PRIVATE'
                ? 'Somente o dono do canal'
                : 'Quem seguir o canal (e o dono)'
            }
          />

          {cepFormatted ? (
            <MetaRow icon="mail-outline" label="CEP" value={cepFormatted} />
          ) : null}

          {community.locationName?.trim() ? (
            <MetaRow icon="location" label="Local" value={community.locationName.trim()} />
          ) : null}

          {community.locationAddress?.trim() ? (
            <MetaRow
              icon="navigate-outline"
              label="Endereço"
              value={community.locationAddress.trim()}
            />
          ) : null}

          {coords && onOpenMap ? (
            <Pressable
              style={({ pressed }) => [styles.mapBtn, pressed && styles.mapBtnPressed]}
              onPress={onOpenMap}
            >
              <Ionicons name="map" size={20} color="#fff" />
              <Text style={styles.mapBtnText}>Abrir localização no mapa</Text>
            </Pressable>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard title="Sua participação">
        <View style={styles.actionsWrap}>{actionButtons}</View>
      </SectionCard>
    </View>
  );
}

interface CommunityFeedSectionHeaderProps {
  postsCount: number;
  canPost: boolean;
  postHint?: string | null;
}

export function CommunityFeedSectionHeader({
  postsCount,
  canPost,
  postHint,
}: CommunityFeedSectionHeaderProps) {
  return (
    <View style={styles.feedHeader}>
      <View style={styles.feedHeaderTop}>
        <View>
          <Text style={styles.feedTitle}>Publicações</Text>
          <Text style={styles.feedSubtitle}>
            {postsCount === 0
              ? 'Nenhuma publicação no canal ainda'
              : postsCount === 1
                ? '1 publicação no feed'
                : `${postsCount} publicações no feed`}
          </Text>
        </View>
        {canPost ? (
          <View style={styles.canPostBadge}>
            <Ionicons name="create-outline" size={14} color="#0e7490" />
            <Text style={styles.canPostBadgeText}>Pode publicar</Text>
          </View>
        ) : null}
      </View>
      {postHint ? (
        <View style={styles.feedHintBox}>
          <Ionicons name="information-circle-outline" size={18} color="#0e7490" />
          <Text style={styles.feedHintText}>{postHint}</Text>
        </View>
      ) : null}
      <View style={styles.feedDivider} />
    </View>
  );
}

export function CommunityFeedEmpty() {
  return (
    <View style={styles.emptyFeed}>
      <Ionicons name="chatbubbles-outline" size={40} color={AppColors.text.quaternary} />
      <Text style={styles.emptyFeedTitle}>Canal sem publicações</Text>
      <Text style={styles.emptyFeedHint}>
        Quando alguém publicar aqui, as mensagens aparecerão nesta lista.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRoot: { gap: 12 },
  hero: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0e7490',
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroTopBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(8,145,178,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  privacyPillPrivate: { backgroundColor: 'rgba(100,116,139,0.95)' },
  privacyPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  categoryPill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  categoryPillText: { fontSize: 11, fontWeight: '800', color: '#0e7490' },
  heroBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 8,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  rolePillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: AppColors.background.default,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  chipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  chipValue: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  chipLabel: { fontSize: 11, fontWeight: '600', color: AppColors.text.tertiary, marginTop: 2 },
  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  aboutText: { fontSize: 15, lineHeight: 22, color: '#475569' },
  infoList: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  metaBody: { flex: 1, minWidth: 0 },
  metaLabel: { fontSize: 11, fontWeight: '700', color: AppColors.text.quaternary },
  metaValue: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginTop: 2 },
  metaPressed: { opacity: 0.75 },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 4,
  },
  creatorAvatar: { width: 44, height: 44, borderRadius: 22 },
  creatorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorInitial: { color: '#fff', fontWeight: '800', fontSize: 18 },
  creatorText: { flex: 1 },
  mapBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0891b2',
    paddingVertical: 12,
    borderRadius: 12,
  },
  mapBtnPressed: { opacity: 0.9 },
  mapBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  actionsWrap: { gap: 10 },
  feedHeader: { marginHorizontal: 16, marginTop: 8, gap: 10 },
  feedHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  feedTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  feedSubtitle: { fontSize: 13, color: AppColors.text.tertiary, marginTop: 4, fontWeight: '500' },
  canPostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfeff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  canPostBadgeText: { fontSize: 11, fontWeight: '800', color: '#0e7490' },
  feedHintBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f0fdfa',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  feedHintText: { flex: 1, fontSize: 13, lineHeight: 18, color: '#0f766e', fontWeight: '500' },
  feedDivider: { height: 1, backgroundColor: AppColors.border.muted },
  emptyFeed: {
    marginHorizontal: 24,
    marginVertical: 28,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  emptyFeedTitle: { fontSize: 16, fontWeight: '800', color: AppColors.text.secondary },
  emptyFeedHint: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
