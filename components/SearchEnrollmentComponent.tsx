import CrecheSchoolList from '@/components/CrecheSchoolList';
import DocumentDescription from '@/components/DocumentDescription';
import FundamentalSchoolList from '@/components/FundamentalSchoolList';
import MedioSchoolList from '@/components/MedioSchoolList';
import { AppColors } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const educationLevels = [
  {
    id: 'creche',
    title: 'Creche',
    description: 'Para crianças de 0 a 3 anos',
    iconName: 'baby-face-outline' as const,
    backgroundColor: AppColors.palette.amber.light,
    iconColor: AppColors.palette.amber.base,
  },
  {
    id: 'fundamental',
    title: 'Ensino Fundamental',
    description: 'Do 1º ao 9º ano',
    iconName: 'school-outline' as const,
    backgroundColor: AppColors.palette.sky.light,
    iconColor: AppColors.palette.sky.base,
  },
  {
    id: 'medio',
    title: 'Ensino Médio',
    description: 'Do 1º ao 3º ano',
    iconName: 'book-education-outline' as const,
    backgroundColor: AppColors.palette.indigo.light,
    iconColor: AppColors.palette.indigo.base,
  },
];

export default function SearchEnrollmentComponent() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const handleBack = () => setSelectedLevel(null);

  if (selectedLevel === 'creche') {
    return <CrecheSchoolList onBack={handleBack} />;
  }

  if (selectedLevel === 'fundamental') {
    return <FundamentalSchoolList onBack={handleBack} />;
  }

  if (selectedLevel === 'medio') {
    return <MedioSchoolList onBack={handleBack} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Matrícula 2026</Text>
      <Text style={styles.sectionSubtitle}>
        Encontre a escola ideal para cada etapa da vida escolar.
      </Text>

      <FlatList
        data={educationLevels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedLevel(item.id)}
            style={({ pressed }) => [styles.levelCard, pressed && styles.levelCardPressed]}
          >
            <View style={[styles.levelIcon, { backgroundColor: item.backgroundColor }]}>
              <MaterialCommunityIcons name={item.iconName} size={24} color={item.iconColor} />
            </View>
            <View style={styles.levelContent}>
              <Text style={styles.levelTitle}>{item.title}</Text>
              <Text style={styles.levelDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={AppColors.text.quaternary} />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={<DocumentDescription />}
      />
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background.input,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: AppColors.text.secondary,
  },
  levelsTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  levelCardPressed: {
    backgroundColor: AppColors.background.overlay,
  },
  levelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.background.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelContent: {
    flex: 1,
    gap: 4,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  levelDescription: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  separator: {
    height: 12,
  },
});