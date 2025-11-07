import FilterTabs, { FilterOption } from '@/components/FilterTabs';
import { AppColors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FILTERS: FilterOption[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'noticias', label: 'Notícias' },
  { key: 'obras', label: 'Obras' },
  { key: 'lazer', label: 'Lazer' },
];

type NotificationType = 'alert' | 'job' | 'education';

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  type: NotificationType;
}

const CONTENT: NotificationItem[] = [
  {
    id: 1,
    title: 'Alerta de chuva forte',
    description: 'Previsão de chuvas intensas para a sua região nas próximas 2 horas. Evite áreas de risco.',
    date: 'agora',
    category: 'noticias',
    type: 'alert',
  },
  {
    id: 2,
    title: 'Nova Vaga de Emprego',
    description: 'Uma nova oportunidade de "Analista Jr." foi publicada perto de você. Veja os detalhes.',
    date: 'há 15 min',
    category: 'obras',
    type: 'job',
  },
  {
    id: 3,
    title: 'Status da Matrícula',
    description: 'Sua solicitação de pré-matrícula na "Escola Municipal Madrid" foi recebida com sucesso.',
    date: 'Há 2h',
    category: 'lazer',
    type: 'education',
  },
];

interface NotificationProps {
}

export default function Notification({}: NotificationProps) {
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  const filteredContent = useMemo(() => {
    if (activeFilter === 'todos') {
      return CONTENT;
    }
    return CONTENT.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <FilterTabs
          filters={FILTERS}
          active={activeFilter}
          onSelect={setActiveFilter}
          containerStyle={styles.filterTabsSpacing}
        />
        <View>
          {filteredContent.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.85}>
              <View
                style={[styles.iconWrapper, {
                  backgroundColor: AppColors.notification[item.type]?.background,
                }]}
              >
                <MaterialCommunityIcons
                  name={ICON_BY_TYPE[item.type]}
                  size={20}
                  color={AppColors.notification[item.type]?.icon || AppColors.primary}
                />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDate}>{item.date}</Text>
                </View>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  filterTabsSpacing: {
    paddingBottom: 12,
  },
  card: {
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    margin: 10,

  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
    flexShrink: 1,
    paddingRight: 8,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.quaternary,
    textTransform: 'capitalize',
  },
  cardDescription: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    lineHeight: 20,
  },
});

const ICON_BY_TYPE: Record<NotificationType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  alert: 'cloud-alert-outline',
  job: 'briefcase-outline',
  education: 'school-outline',
};