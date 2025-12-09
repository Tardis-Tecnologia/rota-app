import { AppColors } from '@/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Cores do poll (do global.css)
const POLL_GRADIENT_START = '#667eea';
const POLL_GRADIENT_END = '#764ba2';
const POLL_OPTION_BG = 'rgba(255, 255, 255, 0.15)';
const POLL_OPTION_BG_SELECTED = 'rgba(255, 255, 255, 1)';
const POLL_TEXT = '#ffffff';

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
            colors={[POLL_GRADIENT_START, POLL_GRADIENT_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="stats-chart" size={20} color={POLL_TEXT} />
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
                      color={isSelected ? AppColors.primary : POLL_TEXT}
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
    shadowColor: '#000',
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
    color: POLL_TEXT,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: POLL_TEXT,
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
    backgroundColor: POLL_OPTION_BG,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 6,
  },
  optionIcon: {
    marginBottom: 4,
  },
  pollOptionSelected: {
    backgroundColor: POLL_OPTION_BG_SELECTED,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  pollOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: POLL_TEXT,
    textAlign: 'center',
  },
  pollOptionTextSelected: {
    color: AppColors.primary,
  },
});