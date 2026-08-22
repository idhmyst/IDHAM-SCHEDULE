import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

interface QuickChipsProps {
  onSelect: (query: string) => void;
}

const DEFAULT_CHIPS = [
  '📅 Jadwal Hari Ini',
  '📍 Absen Online',
  '👕 Seragam Hari Ini',
  '📝 Daftar Tugas',
  '📍 Ruangan Sekarang',
  '📋 Jadwal Besok',
  '↩️ Undo',
  '❓ Bantuan',
];

export const QuickChips: React.FC<QuickChipsProps> = ({ onSelect }) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {DEFAULT_CHIPS.map((chip, index) => (
          <TouchableOpacity
            key={index}
            style={styles.chip}
            onPress={() => onSelect(chip)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText} numberOfLines={1} ellipsizeMode="clip">
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    alignSelf: 'center',
    flexShrink: 0,
  },
  chipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
