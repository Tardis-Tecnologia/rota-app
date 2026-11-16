import { AppColors } from '@/constants/theme';
import { personDisplayName } from '@/utils/userDisplayName';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type FeedLiker = {
  userId: string;
  name: string;
  photoUrl?: string | null;
};

type FeedLikesSheetProps = {
  visible: boolean;
  likers: FeedLiker[];
  likesCount: number;
  loading: boolean;
  onClose: () => void;
};

function formatCurtidasLabel(count: number): string {
  if (count === 1) return '1 curtida';
  return `${count} curtidas`;
}

export default function FeedLikesSheet({
  visible,
  likers,
  likesCount,
  loading,
  onClose,
}: FeedLikesSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.min(Math.round(windowHeight * 0.62), 560);
  const shownCount = likers.length > 0 ? likers.length : likesCount;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={[styles.sheetWrap, { height: sheetHeight }]}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Curtidas</Text>
                <Text style={styles.subtitle}>{formatCurtidasLabel(shownCount)}</Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Fechar curtidas"
              >
                <Ionicons name="close" size={20} color={AppColors.text.secondary} />
              </Pressable>
            </View>
            <View style={styles.body}>
              {loading && likers.length === 0 ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color={AppColors.primary} />
                </View>
              ) : likers.length === 0 ? (
                <View style={styles.centerState}>
                  <Ionicons name="heart-outline" size={36} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>
                    {likesCount > 0 ? 'Curtidas não carregaram' : 'Nenhuma curtida ainda'}
                  </Text>
                  <Text style={styles.emptyHint}>
                    {likesCount > 0
                      ? 'Feche e abra de novo para tentar outra vez.'
                      : 'Seja o primeiro a curtir.'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={likers}
                  keyExtractor={(item) => item.userId}
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                  renderItem={({ item }) => {
                    const name = personDisplayName(item.name, 'Morador(a)');
                    return (
                      <Pressable
                        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                        onPress={() => {
                          if (!item.userId) return;
                          onClose();
                          router.push({
                            pathname: '/forum/author',
                            params: {
                              userId: item.userId,
                              name,
                              photoUrl: item.photoUrl ?? '',
                            },
                          });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver perfil de ${name}`}
                      >
                        {item.photoUrl ? (
                          <Image source={{ uri: item.photoUrl }} style={styles.avatarImage} />
                        ) : (
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                          </View>
                        )}
                        <Text style={styles.name} numberOfLines={1}>
                          {name}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  closeBtnPressed: {
    opacity: 0.75,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  centerState: {
    flex: 1,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
