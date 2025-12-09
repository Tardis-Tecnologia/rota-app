import { AppColors } from '@/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PollOption = 'iluminacao' | 'asfalto' | 'seguranca';

interface OpinionCardProps {
  onVote?: () => void;
}

export default function OpinionCard({ onVote }: OpinionCardProps) {
  const [selectedOption, setSelectedOption] = useState<PollOption | null>('seguranca');

  const handleOptionPress = (option: PollOption) => {
    setSelectedOption(option);
    if (onVote) {
      onVote();
    }
  };

  const pollOptions: Array<{ id: PollOption; label: string; iconName: keyof typeof MaterialIcons.glyphMap }> = [
    { id: 'iluminacao', label: 'Iluminação', iconName: 'lightbulb-outline' },
    { id: 'asfalto', label: 'Asfalto', iconName: 'add-road' },
    { id: 'seguranca', label: 'Segurança', iconName: 'security' },
  ];

  return (
    <View style={styles.section}>
        <View style={styles.pollCard}>
          <LinearGradient
            colors={[AppColors.poll.gradientStart, AppColors.poll.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="stats-chart" size={20} color={AppColors.poll.text} />
              <Text style={styles.headerText}>Sua opinião importa!</Text>
            </View>

            {/* Question */}
            <Text style={styles.question}>Qual a prioridade para o seu bairro este mês?</Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {pollOptions.map((option) => {
                const isSelected = selectedOption === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.pollOption,
                      isSelected && styles.pollOptionSelected,
                    ]}
                    onPress={() => handleOptionPress(option.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={option.iconName}
                      size={18}
                      color={isSelected ? AppColors.primary : AppColors.poll.text}
                      style={styles.optionIcon}
                    />
                    <Text
                      style={[
                        styles.pollOptionText,
                        isSelected && styles.pollOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </LinearGradient>
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
  gradient: {
    padding: 18,
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
    color: AppColors.poll.text,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.poll.text,
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
    backgroundColor: AppColors.poll.optionBg,
    borderWidth: 1,
    borderColor: AppColors.poll.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 6,
  },
  optionIcon: {
    marginBottom: 4,
  },
  pollOptionSelected: {
    backgroundColor: AppColors.poll.optionBgSelected,
    borderColor: AppColors.poll.borderSelected,
  },
  pollOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.poll.text,
    textAlign: 'center',
  },
  pollOptionTextSelected: {
    color: AppColors.primary,
  },
});