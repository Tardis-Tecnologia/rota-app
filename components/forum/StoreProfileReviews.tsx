import ProviderStarRatingPicker from '@/components/guia/ProviderStarRatingPicker';
import { AppColors } from '@/constants/theme';
import {
  listCommercialStoreReviews,
  upsertCommercialStoreReview,
  type CommercialStoreReview,
  type CommercialStoreReviews,
} from '@/services/commercialStoreApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type StoreProfileReviewsProps = {
  commercialAccountId: string;
  canReview: boolean;
  loginHint?: boolean;
};

function formatStars(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ReviewStars({ value }: { value: number }) {
  return (
    <View style={styles.starRow}>
      <Ionicons name="star" size={13} color="#EAB308" />
      <Text style={styles.starValue}>{formatStars(value)}</Text>
    </View>
  );
}

export default function StoreProfileReviews({
  commercialAccountId,
  canReview,
  loginHint = false,
}: StoreProfileReviewsProps) {
  const [data, setData] = useState<CommercialStoreReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPayload = useCallback((payload: CommercialStoreReviews) => {
    setData(payload);
    setStars(payload.mine?.stars ?? null);
    setComment(payload.mine?.comment ?? '');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const id = commercialAccountId.trim();
      if (!id) {
        setData(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const payload = await listCommercialStoreReviews(id);
        if (!cancelled) applyPayload(payload);
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : 'Não foi possível carregar as avaliações.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [applyPayload, commercialAccountId]);

  const publish = useCallback(async () => {
    const text = comment.trim();
    if (stars == null || text.length < 3 || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = await upsertCommercialStoreReview(commercialAccountId, {
        stars,
        comment: text,
      });
      applyPayload(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível publicar a avaliação.');
    } finally {
      setSaving(false);
    }
  }, [applyPayload, comment, commercialAccountId, saving, stars]);

  const reviews = data?.reviews ?? [];
  const hasAverage = (data?.ratingCount ?? 0) > 0;
  const canPublish = stars != null && comment.trim().length >= 3 && !saving;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Avaliações</Text>
        {hasAverage ? (
          <View style={styles.average}>
            <Ionicons name="star" size={14} color="#EAB308" />
            <Text style={styles.averageValue}>{formatStars(data?.ratingAverage ?? 0)}</Text>
            <Text style={styles.averageCount}>({data?.ratingCount})</Text>
          </View>
        ) : null}
      </View>

      {loading ? <ActivityIndicator color="#0d9488" /> : null}
      {!loading && error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && reviews.length === 0 ? (
        <Text style={styles.empty}>Esta loja ainda não recebeu avaliações.</Text>
      ) : null}
      {!loading
        ? reviews.map((review) => <ReviewRow key={review.id} review={review} />)
        : null}

      {loginHint ? (
        <Text style={styles.empty}>
          Faça login com uma conta cadastrada para avaliar a loja.
        </Text>
      ) : null}

      {canReview ? (
        <View style={styles.composer}>
          <Text style={styles.composerLabel}>
            {data?.mine ? 'Sua avaliação' : 'Avaliar esta loja'}
          </Text>
          <ProviderStarRatingPicker
            value={stars}
            onSelect={setStars}
            saving={saving}
          />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Conte como foi sua experiência"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            multiline
            maxLength={500}
            editable={!saving}
          />
          <Pressable
            style={({ pressed }) => [
              styles.publishBtn,
              !canPublish && styles.publishBtnDisabled,
              pressed && canPublish && styles.publishBtnPressed,
            ]}
            onPress={() => void publish()}
            disabled={!canPublish}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.publishBtnText}>
                {data?.mine ? 'Atualizar avaliação' : 'Publicar avaliação'}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ReviewRow({ review }: { review: CommercialStoreReview }) {
  const when = formatReviewDate(review.createdAt);
  return (
    <View style={styles.review}>
      <View style={styles.reviewHeader}>
        <Text style={styles.author} numberOfLines={1}>
          {review.authorName}
        </Text>
        <ReviewStars value={review.stars} />
      </View>
      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
      {when ? <Text style={styles.when}>{when}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  average: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  averageValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  averageCount: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  empty: { fontSize: 14, lineHeight: 20, color: AppColors.text.tertiary },
  error: { fontSize: 13, lineHeight: 18, color: '#b91c1c' },
  review: {
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  author: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1e293b' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starValue: { fontSize: 13, fontWeight: '700', color: '#a16207' },
  comment: { fontSize: 14, lineHeight: 20, color: '#334155' },
  when: { fontSize: 12, color: '#94a3b8' },
  composer: { gap: 10, paddingTop: 4 },
  composerLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    textAlignVertical: 'top',
    backgroundColor: '#f8fafc',
  },
  publishBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnDisabled: { opacity: 0.45 },
  publishBtnPressed: { opacity: 0.85 },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
