import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { VisitanteLoginOverlay } from '@/components/VisitanteLoginOverlay';

type VisitanteRestrictedZoneProps = {
  message?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Envolve uma área interativa: visitante vê o conteúdo por baixo, mas não consegue interagir
 * (mesmo padrão de OpinionCard / loja de recompensas).
 */
export function VisitanteRestrictedZone({
  message,
  children,
  style,
}: VisitanteRestrictedZoneProps) {
  return (
    <View style={[styles.shell, style]}>
      {children}
      <VisitanteLoginOverlay message={message} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
  },
});
