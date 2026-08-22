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
import { DayName, DaySchedule, MeetingAgenda, ScheduleItem, ScheduleOverride, TaskAssignment } from '../types';
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);
  const [dayMeetings, setDayMeetings] = useState<MeetingAgenda[]>([]);
  const [dayTasks, setDayTasks] = useState<TaskAssignment[]>([]);
  const [calendarWeek, setCalendarWeek] = useState<Date[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    generateCurrentWeek();
    const todayKey = ScheduleService.getDayKeyFromDate(new Date());
    if (['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(todayKey)) {
      setSelectedDay(todayKey);
    }
  }, []);

  useEffect(() => {
    loadScheduleAndAgendas();
  }, [selectedDay, currentClass, selectedDate]);

  const generateCurrentWeek = () => {
    const curr = new Date();
    const week: Date[] = [];
    // Start from Monday (day 1)
    const first = curr.getDate() - (curr.getDay() === 0 ? 6 : curr.getDay() - 1);

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(curr.getFullYear(), curr.getMonth(), first + i);
      week.push(nextDay);
    }
    setCalendarWeek(week);
  };

  const loadScheduleAndAgendas = async () => {
    const data = await ScheduleService.getScheduleForDay(currentClass, selectedDay);
    setDaySchedule(data);

    // Get meetings and tasks for the selected date
    const dateStr = selectedDate.toISOString().split('T')[0];
    const allMeetings = await StorageService.getMeetings();
    const allTasks = await StorageService.getTasks();

    setDayMeetings(allMeetings.filter(m => m.date === dateStr));
    setDayTasks(allTasks.filter(t => t.deadlineDate === dateStr));
  };

  const handleSelectCalendarDate = (date: Date) => {
    setSelectedDate(date);
    const dayKey = ScheduleService.getDayKeyFromDate(date);
    setSelectedDay(dayKey);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadScheduleAndAgendas();
    setRefreshing(false);
  };

  const handleEditItem = (item: ScheduleItem) => {
    setSelectedItemForEdit(item);
    setShowOverrideModal(true);
  };

  const handleSaveOverride = async (override: ScheduleOverride) => {
    await StorageService.saveOverride(override);
    await loadScheduleAndAgendas();
  };

  const getMonthName = (date: Date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="JADWAL & KALENDER"
        subtitle="Timeline Interaktif"
        currentClass={currentClass}
        onClassPress={onOpenSettings}
      />

      {/* Calendar Header Month */}
      <View style={styles.calendarHeader}>
        <Text style={styles.monthTitle}>📅 {getMonthName(selectedDate)}</Text>
      </View>

      {/* Interactive Horizontal Calendar Week Strip */}
      <View style={styles.calendarStrip}>
        {calendarWeek.map((date, idx) => {
          const isSelected = isSameDay(date, selectedDate);
          const dayNameShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][date.getDay()];
          const dateNum = date.getDate();
          const isWeekday = date.getDay() >= 1 && date.getDay() <= 5;

          return (
            <TouchableOpacity
              key={idx}
              style={[styles.calendarDayBox, isSelected && styles.selectedCalendarDayBox]}
              onPress={() => handleSelectCalendarDate(date)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  isSelected && styles.selectedCalendarDayText,
                ]}
              >
                {dayNameShort}
              </Text>
              <Text
                style={[
                  styles.calendarDateText,
                  isSelected && styles.selectedCalendarDateText,
                ]}
              >
                {dateNum}
              </Text>

              {/* Indicator Dot */}
              <View style={styles.dotsContainer}>
                {isWeekday && <View style={[styles.indicatorDot, isSelected && styles.whiteDot]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day Tabs */}
      <View style={styles.tabContainer}>
        {DAYS.map(day => {
          const isActive = selectedDay === day.key;
          return (
            <TouchableOpacity
              key={day.key}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => {
                setSelectedDay(day.key);
                // Update selected date to match day in current week
                const matchDate = calendarWeek.find(d => ScheduleService.getDayKeyFromDate(d) === day.key);
                if (matchDate) setSelectedDate(matchDate);
              }}
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

        {/* Quick Edit Schedule Action Bar */}
        <TouchableOpacity
          style={styles.quickOverrideBtn}
          onPress={() => {
            setSelectedItemForEdit(null);
            setShowOverrideModal(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.quickOverrideIcon}>✏️</Text>
          <Text style={styles.quickOverrideText}>
            Ubah / Sesuaikan Jadwal Hari {selectedDay.toUpperCase()}
          </Text>
          <Text style={styles.quickOverrideArrow}>➔</Text>
        </TouchableOpacity>

        {/* Agendas for this specific date */}
        {dayTasks.length > 0 && (
          <View style={styles.sectionAgenda}>
            <Text style={styles.sectionAgendaTitle}>⚠️ DEADLINE TUGAS HARI INI ({dayTasks.length})</Text>
            {dayTasks.map(t => (
              <View key={t.id} style={styles.taskAlertCard}>
                <Text style={styles.taskAlertTitle}>📝 {t.title} ({t.subject})</Text>
                <Text style={styles.taskAlertTime}>Pukul {t.deadlineTime} WIB {t.attachedFileName ? `• 📎 ${t.attachedFileName}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {dayMeetings.length > 0 && (
          <View style={styles.sectionAgenda}>
            <Text style={styles.sectionAgendaTitle}>📌 JANJI MEETING HARI INI ({dayMeetings.length})</Text>
            {dayMeetings.map(m => (
              <View key={m.id} style={styles.meetingAlertCard}>
                <Text style={styles.meetingAlertTitle}>📌 {m.title}</Text>
                <Text style={styles.meetingAlertTime}>⏰ {m.time} WIB @ {m.location}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Schedule List */}
        <View style={styles.listContainer}>
          <Text style={styles.scheduleHeaderTitle}>JADWAL PELAJARAN {selectedDay.toUpperCase()}</Text>
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
          note: selectedItemForEdit?.description,
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
  calendarHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: COLORS.white,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  calendarStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  calendarDayBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  selectedCalendarDayBox: {
    backgroundColor: COLORS.primary,
  },
  calendarDayText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  selectedCalendarDayText: {
    color: COLORS.white,
  },
  calendarDateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 2,
  },
  selectedCalendarDateText: {
    color: COLORS.white,
  },
  dotsContainer: {
    height: 6,
    marginTop: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  whiteDot: {
    backgroundColor: COLORS.white,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 2,
    backgroundColor: COLORS.background,
  },
  activeTabButton: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.primary,
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
    marginTop: 12,
    marginBottom: 6,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    gap: 10,
  },
  uniformIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uniformIcon: {
    fontSize: 16,
  },
  uniformTextContainer: {
    flex: 1,
  },
  uniformTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  uniformDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  quickOverrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  quickOverrideIcon: {
    fontSize: 14,
  },
  quickOverrideText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  quickOverrideArrow: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sectionAgenda: {
    marginHorizontal: 16,
    marginTop: 10,
    gap: 6,
  },
  sectionAgendaTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  taskAlertCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
  },
  taskAlertTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400E',
  },
  taskAlertTime: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  meetingAlertCard: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10,
  },
  meetingAlertTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  meetingAlertTime: {
    fontSize: 11,
    color: '#1D4ED8',
    marginTop: 2,
  },
  listContainer: {
    paddingTop: 10,
  },
  scheduleHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginHorizontal: 16,
    marginBottom: 6,
    letterSpacing: 0.5,
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
