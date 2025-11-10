import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DocumentDescription() {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={AppColors.palette.sky.base}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Documentos Necessários</Text>
          <Text style={styles.subtitle}>
            Para efetivar a matrícula, geralmente são necessários os seguintes documentos (originais e cópias):
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              <Text style={styles.listStrong}>Do Aluno:</Text> Certidão de Nascimento, CPF, Cartão do SUS e Caderneta de Vacinação atualizada.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.listStrong}>Do Responsável:</Text> RG, CPF e Comprovante de Residência recente.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.listStrong}>Escolaridade:</Text> Histórico Escolar ou Declaração da última escola (exceto para creche e 1º ano).
            </Text>
          </View>
          <Text style={styles.footer}>
            Obs: Esta é uma lista comum. A escola pode solicitar documentos adicionais.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    padding: 20,
    marginTop: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconContainer: {
    backgroundColor: AppColors.palette.sky.light,
    borderRadius: 999,
    padding: 12,
  },
  textContainer: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  subtitle: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  list: {
    marginTop: 8,
    gap: 6,
  },
  listItem: {
    fontSize: 13,
    color: AppColors.text.secondary,
    lineHeight: 18,
  },
  listStrong: {
    fontWeight: '700',
  },
  footer: {
    marginTop: 10,
    fontSize: 12,
    color: AppColors.text.quaternary,
  },
});

