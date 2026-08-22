import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { DayName, DaySchedule, ScheduleItem, ScheduleOverride } from '../types';
import { Header } from '../components/Header';
import { ScheduleCard } from '../components/ScheduleCard';
import { OverrideModal } from '../components/OverrideModal';
import { ScheduleService } from '../services/scheduleService';
import { StorageService } from '../services/storage';

interface ScheduleScreenProps {
  currentClass: string;
  onOpenSettings?: () => void;
}

const DAYS: { key: DayName; label: string }[] = [
  { key: 'senin', label: 'Senin' },
  { key: 'selasa', label: 'Selasa' },
  { key: 'rabu', label: 'Rabu' },
  { key: 'kamis', label: 'Kamis' },
  { key: 'jumat', label: 'Jumat' },
];

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  currentClass,
  onOpenSettings,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayName>('senin');
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    const todayKey = ScheduleService.getDayKeyFromDate(new Date());
    if (['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(todayKey)) {
      setSelectedDay(todayKey);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [selectedDay, currentClass]);

  const loadSchedule = async () => {
    const data = await ScheduleService.getScheduleForDay(currentClass, selectedDay);
    setDaySchedule(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  };

  const handleEditItem = (item: ScheduleItem) => {
    setSelectedItemForEdit(item);
    setShowOverrideModal(true);
  };

  const handleSaveOverride = async (override: ScheduleOverride) => {
    await StorageService.saveOverride(override);
    await loadSchedule();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="JADWAL KELAS"
        subtitle="Timeline Mingguan"
        currentClass={currentClass}
        onClassPress={onOpenSettings}
      />

      {/* Day Tabs */}
      <View style={styles.tabContainer}>
        {DAYS.map(day => {
          const isActive = selectedDay === day.key;
          return (
            <TouchableOpacity
              key={day.key}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setSelectedDay(day.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollArea}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Uniform Info Banner */}
        {daySchedule && (
          <View style={styles.uniformBanner}>
            <View style={styles.uniformIconContainer}>
              <Text style={styles.uniformIcon}>👕</Text>
            </View>
            <View style={styles.uniformTextContainer}>
              <Text style={styles.uniformTitle}>Seragam Hari Ini</Text>
              <Text style={styles.uniformDesc}>{daySchedule.uniform}</Text>
            </View>
          </View>
        )}

        {/* Schedule List */}
        <View style={styles.listContainer}>
          {daySchedule?.items && daySchedule.items.length > 0 ? (
            daySchedule.items.map((item, index) => (
              <ScheduleCard
                key={item.id || index.toString()}
                item={item}
                onEditPress={handleEditItem}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏖️</Text>
              <Text style={styles.emptyTitle}>Tidak ada jadwal kelas</Text>
              <Text style={styles.emptySubtitle}>Hari ini bebas kegiatan belajar mengajar.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <OverrideModal
        visible={showOverrideModal}
        className={currentClass}
        initialData={{
          day: selectedDay,
          period: selectedItemForEdit?.period || 1,
          currentSubject: selectedItemForEdit?.subjectName,
          currentRoom: selectedItemForEdit?.room,
        }}
        onClose={() => {
          setShowOverrideModal(false);
          setSelectedItemForEdit(null);
        }}
        onSave={handleSaveOverride}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  uniformBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    gap: 12,
  },
  uniformIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uniformIcon: {
    fontSize: 18,
  },
  uniformTextContainer: {
    flex: 1,
  },
  uniformTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  uniformDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  listContainer: {
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
