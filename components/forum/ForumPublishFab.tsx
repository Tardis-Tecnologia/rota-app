import { AppColors } from '@/constants/theme';
import { useForumModeration } from '@/contexts/ForumModerationContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';

type ForumPublishFabProps = {
  /** Abre o modal de nova publicação (só se a moderação permitir). */
  onOpenPublish: () => void;
  /**
   * Distância do fundo do container pai.
   * Na aba Fórum o pai já termina acima da tab bar — use só o gap padrão.
   * Em telas cheias (ex.: comunidade), passe safe area + margem.
   */
  bottomOffset?: number;
};

/** Quase encostado na tab bar quando o pai é a cena da aba. */
const GAP_ABOVE_TAB_BAR = 4;

export default function ForumPublishFab({ onOpenPublish, bottomOffset }: ForumPublishFabProps) {
  const { requestForumPublish } = useForumModeration();
  const bottom = bottomOffset ?? GAP_ABOVE_TAB_BAR;

  const handlePress = useCallback(() => {
    void requestForumPublish(onOpenPublish);
  }, [onOpenPublish, requestForumPublish]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.fab,
        { bottom },
        pressed && styles.fabPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Nova publicação"
    >
      <Ionicons name="add" size={28} color="#ffffff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.9,
  },
});
