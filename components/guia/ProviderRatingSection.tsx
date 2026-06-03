import ProviderStarRatingPicker from '@/components/guia/ProviderStarRatingPicker';
import { upsertServiceProviderRating } from '@/services/serviceProvidersApi';
import type { ServiceProviderUserRating } from '@/types/serviceProvider';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

type ProviderRatingSectionProps = {
  providerId: string;
  ratingAverage: number;
  ratingCount: number;
  userRating: ServiceProviderUserRating | null | undefined;
  onRatingUpdated: (payload: {
    ratingAverage: number;
    ratingCount: number;
    userRating: ServiceProviderUserRating;
  }) => void;
};

function parseStars(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

export default function ProviderRatingSection({
  providerId,
  ratingAverage,
  userRating,
  onRatingUpdated,
}: ProviderRatingSectionProps) {
  const initialStars = useMemo(() => parseStars(userRating?.stars), [userRating?.stars]);
  const [myStars, setMyStars] = useState<number | null>(initialStars);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMyStars(parseStars(userRating?.stars));
  }, [userRating?.stars]);

  const handleSelect = useCallback(
    async (stars: number) => {
      const previous = myStars;
      setMyStars(stars);
      setSaving(true);
      try {
        const result = await upsertServiceProviderRating(providerId, stars);
        const nextUserRating: ServiceProviderUserRating = {
          stars: result.stars,
          updatedAt: result.updatedAt,
        };
        setMyStars(parseStars(result.stars));
        onRatingUpdated({
          ratingAverage: Number.parseFloat(result.ratingAverage) || ratingAverage,
          ratingCount: result.ratingCount,
          userRating: nextUserRating,
        });
      } catch (e) {
        setMyStars(previous);
        const msg = e instanceof Error ? e.message : 'Não foi possível salvar a avaliação.';
        const lower = msg.toLowerCase();
        if (lower.includes('próprio') || lower.includes('proprio')) {
          Alert.alert('Indisponível', 'Você não pode avaliar o próprio cadastro.');
        } else {
          Alert.alert('Erro', msg);
        }
      } finally {
        setSaving(false);
      }
    },
    [myStars, onRatingUpdated, providerId, ratingAverage],
  );

  return (
    <View style={styles.wrap}>
      <ProviderStarRatingPicker
        value={myStars}
        onSelect={(stars) => void handleSelect(stars)}
        saving={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 10,
  },
});
