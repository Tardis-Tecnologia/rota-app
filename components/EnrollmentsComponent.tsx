import { AppColors } from '@/constants/theme';
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

const mockEnrollments = [
  {
    id: 'mat1',
    studentName: 'Sofia Pereira Costa',
    school: 'Escola Municipal Madrid',
    status: 'Aprovada',
    requestedAt: '08/10/2025',
    photo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'mat2',
    studentName: 'Sofia Pereira Costa',
    school: 'Escola Municipal Pio X',
    status: 'Aprovada',
    requestedAt: '09/10/2025',
    photo: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=60',
  },
];

export default function EnrollmentsComponent() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockEnrollments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Image source={{ uri: item.photo }} style={styles.photo} />
              <View style={styles.cardInfo}>
                <Text style={styles.schoolName}>{item.school}</Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Aluno(a): </Text>
                  {item.studentName}
                </Text>
                <Text style={styles.infoMuted}>
                  <Text style={styles.infoLabel}>Solicitado em: </Text>
                  {item.requestedAt}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={styles.statusValue}>{item.status}</Text>
              </View>
              <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
                <Text style={styles.actionText}>Efetivar Matrícula</Text>
              </Pressable>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    padding: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: AppColors.background.input,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  infoMuted: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  infoLabel: {
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.status.success,
  },
  actionButton: {
    backgroundColor: AppColors.palette.indigo.base,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonPressed: {
    backgroundColor: AppColors.primaryDark,
  },
  actionText: {
    color: AppColors.text.white,
    fontWeight: '600',
    fontSize: 14,
  },
  separator: {
    height: 8,
  },
});