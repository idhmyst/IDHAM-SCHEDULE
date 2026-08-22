import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { ScheduleItem } from '../types';

interface ScheduleCardProps {
  item: ScheduleItem;
  isActive?: boolean;
  onEditPress?: (item: ScheduleItem) => void;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ item, isActive, onEditPress }) => {
  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      {isActive && <View style={styles.activeStrip} />}

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.periodBadge}>
            <Text style={styles.periodText}>
              {item.period === 0 ? 'PAGI' : `JAM ${item.period}`}
            </Text>
          </View>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>

        <View style={styles.bodyRow}>
          <View style={styles.subjectContainer}>
            <Text style={styles.subjectName}>{item.subjectName}</Text>
            <Text style={styles.subjectCode}>Kode: {item.subjectCode}</Text>
            {item.description ? (
              <Text style={styles.descriptionText}>{item.description}</Text>
            ) : null}
          </View>

          <View style={styles.roomContainer}>
            <Text style={styles.roomLabel}>RUANGAN</Text>
            <View style={styles.roomBadge}>
              <Text style={styles.roomText}>{item.room}</Text>
            </View>
          </View>
        </View>

        {onEditPress && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEditPress(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.editText}>✏️ Edit Jadwal Ini</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  activeCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  activeStrip: {
    height: 4,
    backgroundColor: COLORS.primary,
    width: '100%',
  },
  content: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  periodBadge: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  periodText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subjectContainer: {
    flex: 1,
    paddingRight: 12,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  roomContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textLight,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  roomBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  roomText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  editButton: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignItems: 'flex-end',
  },
  editText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
