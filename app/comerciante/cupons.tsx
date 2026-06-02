import ComercianteHeader from '@/components/comerciante/ComercianteHeader';
import ComercianteSectionBanner from '@/components/comerciante/ComercianteSectionBanner';
import DeactivateCommercialCouponModal from '@/components/comerciante/DeactivateCommercialCouponModal';
import EditCommercialCouponModal from '@/components/comerciante/EditCommercialCouponModal';
import { useConferirCupom } from '@/contexts/ConferirCupomContext';
import { useComercianteStore } from '@/contexts/ComercianteStoreContext';
import {
    createCommercialCoupon,
    deactivateCommercialCoupon,
    formatValidUntilDisplay,
    listCommercialCoupons,
    parseValidUntilToIso,
    type CommercialCoupon,
  } from '@/services/commercialCouponsApi';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function ComercianteCuponsScreen() {
  const { refreshCouponStats } = useComercianteStore();
  const { openConferirCupom } = useConferirCupom();
  const [cupons, setCupons] = useState<CommercialCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editCupom, setEditCupom] = useState<CommercialCoupon | null>(null);
  const [deactivateCupom, setDeactivateCupom] = useState<CommercialCoupon | null>(null);

  const [campanha, setCampanha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descontoPercent, setDescontoPercent] = useState('');
  const [validade, setValidade] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCupons = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await listCommercialCoupons('true');
      setCupons(rows);
      await refreshCouponStats();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível carregar os cupons.';
      setLoadError(msg);
      setCupons([]);
    } finally {
      setLoading(false);
    }
  }, [refreshCouponStats]);

  useFocusEffect(
    useCallback(() => {
      void loadCupons();
    }, [loadCupons]),
  );

  const handleSalvar = async () => {
    if (!campanha.trim()) {
      setFormError('Informe o nome da campanha.');
      return;
    }
    const percent = Number.parseInt(descontoPercent.trim(), 10);
    if (!descontoPercent.trim() || Number.isNaN(percent) || percent < 1 || percent > 100) {
      setFormError('Informe o desconto entre 1% e 100%.');
      return;
    }

    const codigoTrim = codigo.trim();
    if (codigoTrim && !/^[A-Za-z0-9_-]{3,32}$/.test(codigoTrim)) {
      setFormError('Código: use 3 a 32 caracteres (letras, números, hífen ou _).');
      return;
    }

    const validUntilIso = validade.trim() ? parseValidUntilToIso(validade) : undefined;
    if (validade.trim() && !validUntilIso) {
      setFormError('Validade inválida. Use DD/MM/AAAA.');
      return;
    }

    setFormError('');
    setSaving(true);
    try {
      const created = await createCommercialCoupon({
        name: campanha.trim(),
        discountPercent: percent,
        code: codigoTrim || undefined,
        validUntil: validUntilIso,
      });
      setCupons((prev) => [created, ...prev]);
      await refreshCouponStats();
      setCampanha('');
      setCodigo('');
      setDescontoPercent('');
      setValidade('');
      Alert.alert(
        'Cupom gerado',
        `Código: ${created.code}\nCompartilhe o QR ou o código com o cliente.`,
      );
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível salvar o cupom.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeactivate = async (cupom: CommercialCoupon) => {
    await deactivateCommercialCoupon(cupom.id);
    setCupons((prev) => prev.filter((c) => c.id !== cupom.id));
    await refreshCouponStats();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ComercianteHeader showForumButton={false} />

        <View style={styles.body}>
          <ComercianteSectionBanner
            title="CENTRAL DE CUPONS"
            description="Objetivo de cupons: lançar campanhas claras para gerar resgates hoje."
          />

          <View style={styles.formCard}>
            <View style={styles.formTitleRow}>
              <Ionicons name="pricetag" size={20} color="#0d9488" />
              <Text style={styles.formTitle}>Criar novo cupom</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.qrBtn, pressed && styles.qrBtnPressed]}
              onPress={openConferirCupom}
            >
              <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
              <Text style={styles.qrBtnText}>Conferir cupom (QR Code)</Text>
            </Pressable>

            <Text style={styles.qrHint}>
              Código opcional: se deixar em branco, o sistema gera um ROTA-CUP1-… automaticamente.
            </Text>

            <View style={styles.divider} />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome da campanha (ex: Banho e tosa)</Text>
              <TextInput
                value={campanha}
                onChangeText={(v) => {
                  setCampanha(v);
                  setFormError('');
                }}
                placeholder="Nome da campanha"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Código do cupom (opcional)</Text>
              <TextInput
                value={codigo}
                onChangeText={(v) => {
                  setCodigo(v);
                  setFormError('');
                }}
                placeholder="BANHO20 ou vazio para gerar ROTA-CUP1-…"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Desconto (%)</Text>
              <TextInput
                value={descontoPercent}
                onChangeText={(v) => {
                  setDescontoPercent(v.replace(/[^0-9]/g, ''));
                  setFormError('');
                }}
                placeholder="20"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Validade (opcional, DD/MM/AAAA)</Text>
              <TextInput
                value={validade}
                onChangeText={setValidade}
                placeholder="31/12/2026"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                keyboardType="numeric"
              />
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                (pressed || saving) && styles.saveBtnPressed,
                saving && styles.saveBtnDisabled,
              ]}
              onPress={() => void handleSalvar()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Criar cupom</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.listTitle}>CUPONS PUBLICADOS</Text>

          {loading ? <ActivityIndicator color="#0d9488" style={styles.listLoader} /> : null}

          {loadError && !loading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{loadError}</Text>
              <Pressable onPress={() => void loadCupons()}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && !loadError && cupons.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Você ainda não publicou cupons.</Text>
            </View>
          ) : null}

          {!loading
            ? cupons.map((cupom) => (
                <View key={cupom.id} style={styles.cupomItem}>
                  <View style={styles.cupomItemTop}>
                    <Text style={styles.cupomCampanha}>{cupom.name}</Text>
                    <View style={styles.cupomCodeBadge}>
                      <Text style={styles.cupomCode}>{cupom.code}</Text>
                    </View>
                  </View>
                  <Text style={styles.cupomDesconto}>{cupom.discountPercent}% de desconto</Text>
                  <Text style={styles.cupomUso}>
                    {cupom.usageCount}{' '}
                    {cupom.usageCount === 1 ? 'pessoa usou' : 'pessoas usaram'}
                  </Text>
                  {formatValidUntilDisplay(cupom.validUntil) ? (
                    <Text style={styles.cupomValidade}>
                      Validade: {formatValidUntilDisplay(cupom.validUntil)}
                    </Text>
                  ) : null}
                  <View style={styles.cupomActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        pressed && styles.actionBtnPressed,
                      ]}
                      onPress={() => setEditCupom(cupom)}
                    >
                      <Ionicons name="create-outline" size={16} color="#2563eb" />
                      <Text style={styles.actionBtnTextBlue}>Editar</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.deactivateBtn,
                        pressed && styles.deactivateBtnPressed,
                      ]}
                      onPress={() => setDeactivateCupom(cupom)}
                    >
                      <Text style={styles.deactivateBtnText}>Desativar</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            : null}
        </View>
      </ScrollView>

      <EditCommercialCouponModal
        visible={!!editCupom}
        cupom={editCupom}
        onClose={() => setEditCupom(null)}
        onSaved={(updated) => {
          setCupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          void refreshCouponStats();
        }}
      />

      <DeactivateCommercialCouponModal
        visible={!!deactivateCupom}
        cupom={deactivateCupom}
        onClose={() => setDeactivateCupom(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scroll: {
    paddingBottom: 24,
  },
  body: {
    paddingHorizontal: 16,
    gap: 14,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 14,
  },
  qrBtnPressed: {
    opacity: 0.9,
  },
  qrBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  qrHint: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  formGroup: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  formError: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  saveBtnPressed: {
    opacity: 0.9,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  listLoader: {
    marginVertical: 16,
  },
  emptyBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0d9488',
  },
  cupomItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cupomItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cupomCampanha: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  cupomCodeBadge: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cupomCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0d9488',
    letterSpacing: 0.5,
  },
  cupomDesconto: {
    fontSize: 13,
    color: '#475569',
  },
  cupomUso: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0d9488',
  },
  cupomValidade: {
    fontSize: 12,
    color: '#94a3b8',
  },
  cupomActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionBtnTextBlue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  deactivateBtn: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  deactivateBtnPressed: {
    opacity: 0.85,
  },
  deactivateBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
});
