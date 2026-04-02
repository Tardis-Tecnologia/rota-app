import { AppColors, hexToRgba } from '@/constants/theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PollOption = 'iluminacao' | 'asfalto' | 'seguranca';

interface OpinionCardProps {
  onVote?: () => void;
}

export default function OpinionCard({ onVote }: OpinionCardProps) {
  const { backgroundColor: brandColor } = useAppTheme();
  const [selectedOption, setSelectedOption] = useState<PollOption | null>('seguranca');

  const handleOptionPress = (option: PollOption) => {
    setSelectedOption(option);
    if (onVote) {
      onVote();
    }
  };

  const pollOptions: { id: PollOption; label: string; iconName: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: 'iluminacao', label: 'Iluminação', iconName: 'lightbulb-outline' },
    { id: 'asfalto', label: 'Asfalto', iconName: 'add-road' },
    { id: 'seguranca', label: 'Segurança', iconName: 'security' },
  ];

  const optionBgTint = hexToRgba(brandColor, 0.14);
  const optionBorderTint = hexToRgba(brandColor, 0.35);

  return (
    <View style={styles.section}>
      <View style={styles.pollCard}>
        <View style={styles.cardInner}>
          <View style={styles.header}>
            <Ionicons name="stats-chart" size={20} color={AppColors.primary} />
            <Text style={styles.headerText}>Sua opinião importa!</Text>
          </View>

          <Text style={styles.question}>Qual a prioridade para o seu bairro este mês?</Text>

          <View style={styles.optionsContainer}>
            {pollOptions.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.pollOption,
                    {
                      backgroundColor: isSelected ? AppColors.background.default : optionBgTint,
                      borderColor: isSelected ? brandColor : optionBorderTint,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleOptionPress(option.id)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={option.iconName}
                    size={18}
                    color={isSelected ? brandColor : AppColors.text.secondary}
                    style={styles.optionIcon}
                  />
                  <Text
                    style={[
                      styles.pollOptionText,
                      isSelected ? styles.pollOptionTextSelected : styles.pollOptionTextIdle,
                      isSelected && { color: brandColor },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  pollCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardInner: {
    backgroundColor: AppColors.background.default,
    padding: 18,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pollOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 6,
  },
  optionIcon: {
    marginBottom: 4,
  },
  pollOptionText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  pollOptionTextIdle: {
    color: AppColors.text.secondary,
  },
  pollOptionTextSelected: {
    fontWeight: '700',
  },
});
