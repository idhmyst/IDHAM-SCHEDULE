import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface QuickChipsProps {
  onSelect: (query: string) => void;
}

const DEFAULT_CHIPS = [
  '📅 Jadwal Hari Ini',
  '📍 Ruangan Sekarang',
  '👕 Seragam Hari Ini',
  '📋 Jadwal Besok',
  '📝 Daftar Meeting',
  '❓ Panduan',
];

export const QuickChips: React.FC<QuickChipsProps> = ({ onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {DEFAULT_CHIPS.map((chip, index) => (
        <TouchableOpacity
          key={index}
          style={styles.chip}
          onPress={() => onSelect(chip)}
          activeOpacity={0.7}
        >
          <Text style={styles.chipText}>{chip}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  chipText: {
    color: COLORS.textBody,
    fontSize: 12,
    fontWeight: '500',
  },
});
