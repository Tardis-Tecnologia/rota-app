import { AppColors } from '@/constants/theme';
import ModalRegister from '@/components/ModalRegister';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type MedioSchoolListProps = {
  onBack: () => void;
};

type School = {
  id: string;
  name: string;
  address: string;
  typeLabel: string;
  badgeColor: string;
  badgeBackground: string;
  imageUrl: string;
};

const medioSchools: School[] = [
  {
    id: 'esc1',
    name: 'Colégio Estadual André Maurois',
    address: 'R. Srg. João Lopes, 123 - Ilha do Gov.',
    typeLabel: 'Estadual',
    badgeColor: '#047857',
    badgeBackground: '#d1fae5',
    imageUrl:
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'esc3',
    name: 'Colégio Pedro II - Unidade Centro',
    address: 'Av. Mal. Floriano, 80 - Centro',
    typeLabel: 'Federal',
    badgeColor: '#7c3aed',
    badgeBackground: '#ede9fe',
    imageUrl:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&auto=format&fit=crop&q=60',
  },
];

export default function MedioSchoolList({ onBack }: MedioSchoolListProps) {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const handleCloseModal = () => setSelectedSchool(null);
  const handleBack = () => {
    setSelectedSchool(null);
    onBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={AppColors.text.secondary}
          />
        </Pressable>
        <Text style={styles.title}>Escolas de Ensino Médio</Text>
      </View>

      <FlatList
        data={medioSchools}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text
                style={[
                  styles.badge,
                  {
                    color: item.badgeColor,
                    backgroundColor: item.badgeBackground,
                  },
                ]}
              >
                {item.typeLabel}
              </Text>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.address}</Text>
              <Pressable
                onPress={() => setSelectedSchool(item)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.enrollButton,
                  pressed && styles.enrollButtonPressed,
                ]}
              >
                <Text style={styles.enrollButtonText}>Fazer Pré-matrícula</Text>
              </Pressable>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <ModalRegister
        visible={!!selectedSchool}
        schoolName={selectedSchool?.name ?? ''}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border.muted,
    backgroundColor: AppColors.background.overlay,
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
  },
  backButtonPressed: {
    backgroundColor: AppColors.background.input,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: AppColors.background.input,
  },
  cardContent: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cardTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  enrollButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  enrollButtonPressed: {
    opacity: 0.6,
  },
  enrollButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.accent,
  },
  separator: {
    height: 12,
  },
});


