import { AppColors } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Internship = {
  id: string;
  title: string;
  organization: string;
  deadline: string;
  salary: string;
  icon: {
    set: 'ion' | 'mci';
    name: string;
  };
};

const internships: Internship[] = [
  {
    id: 'internship-1',
    title: 'Estágio em Direito',
    organization: 'Tribunal de Justiça',
    deadline: '20/11/2025',
    salary: 'R$ 1.200 + VT',
    icon: { set: 'mci', name: 'scale-balance' },
  },
  {
    id: 'internship-2',
    title: 'Jovem Aprendiz Administrativo',
    organization: 'Secretaria de Educação',
    deadline: 'Inscrições abertas',
    salary: 'Salário Mínimo-hora',
    icon: { set: 'ion', name: 'document-text-outline' },
  },
];

export default function InternshipOpportunities() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estágio e Jovem Aprendiz</Text>

      <FlatList
        data={internships}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconWrapper}>
              {item.icon.set === 'mci' ? (
                <MaterialCommunityIcons
                  name={item.icon.name as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={22}
                  color={AppColors.palette.indigo.base}
                />
              ) : (
                <Ionicons
                  name={item.icon.name as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={AppColors.palette.indigo.base}
                />
              )}
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.organization}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.deadlineText}>
                  Prazo:{' '}
                  <Text style={styles.deadlineValue}>{item.deadline}</Text>
                </Text>
                <Text style={styles.salary}>{item.salary}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.chevronButton,
                pressed && styles.chevronButtonPressed,
              ]}
              hitSlop={6}
            >
              <Ionicons
                name='chevron-forward'
                size={18}
                color={AppColors.text.quaternary}
              />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  listContent: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: AppColors.background.default,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: AppColors.palette.indigo.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  deadlineText: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  deadlineValue: {
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  salary: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.palette.teal.base,
  },
  chevronButton: {
    padding: 8,
    borderRadius: 999,
  },
  chevronButtonPressed: {
    backgroundColor: AppColors.background.overlayPressed,
  },
});

