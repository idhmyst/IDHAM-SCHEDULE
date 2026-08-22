import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../constants/theme';
import { MeetingAgenda, TaskAssignment } from '../types';
import { Header } from '../components/Header';
import { MeetingModal } from '../components/MeetingModal';
import { TaskModal } from '../components/TaskModal';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';

interface MeetingScreenProps {
  currentClass: string;
  onOpenSettings?: () => void;
}

type DateFilterType = 'all' | 'today' | 'tomorrow' | 'this_week';

export const MeetingScreen: React.FC<MeetingScreenProps> = ({
  currentClass,
  onOpenSettings,
}) => {
  const [section, setSection] = useState<'tasks' | 'meetings'>('tasks');
  const [meetings, setMeetings] = useState<MeetingAgenda[]>([]);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingAgenda | undefined>(undefined);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const m = await StorageService.getMeetings();
    const t = await StorageService.getTasks();
    setMeetings(m);
    setTasks(t);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Meeting Handlers
  const handleToggleMeetingComplete = async (id: string) => {
    await StorageService.toggleMeetingCompleted(id);
    await loadData();
  };

  const handleDeleteMeeting = async (id: string) => {
    Alert.alert('Hapus Meeting', 'Yakin ingin menghapus agenda meeting ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await StorageService.deleteMeeting(id);
          await loadData();
          await NotificationService.scheduleAllReminders();
        },
      },
    ]);
  };

  const handleSaveMeeting = async (meeting: MeetingAgenda) => {
    await StorageService.saveMeeting(meeting);
    await loadData();
    await NotificationService.scheduleAllReminders();
  };

  // Task Handlers
  const handleToggleTaskComplete = async (id: string) => {
    await StorageService.toggleTaskCompleted(id);
    await loadData();
  };

  const handleDeleteTask = async (id: string) => {
    Alert.alert('Hapus Tugas', 'Yakin ingin menghapus tugas ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await StorageService.deleteTask(id);
          await loadData();
          await NotificationService.scheduleAllReminders();
        },
      },
    ]);
  };

  const handleSaveTask = async (task: TaskAssignment) => {
    await StorageService.saveTask(task);
    await loadData();
    await NotificationService.scheduleAllReminders();
  };

  const handleOpenFile = async (fileUri?: string) => {
    if (!fileUri) return;
    try {
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('File Lampiran', `Lokasi file: ${fileUri}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Tidak dapat membuka file lampiran.');
    }
  };

  const isMatchingDateFilter = (itemDateStr: string) => {
    if (dateFilter === 'all') return true;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateFilter === 'today') return itemDateStr === todayStr;
    if (dateFilter === 'tomorrow') return itemDateStr === tomorrowStr;

    if (dateFilter === 'this_week') {
      const targetDate = new Date(itemDateStr);
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }

    return true;
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending' && t.isCompleted) return false;
    if (filter === 'completed' && !t.isCompleted) return false;
    return isMatchingDateFilter(t.deadlineDate);
  });

  const filteredMeetings = meetings.filter(m => {
    if (filter === 'pending' && m.isCompleted) return false;
    if (filter === 'completed' && !m.isCompleted) return false;
    return isMatchingDateFilter(m.date);
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="TUGAS & AGENDA"
        subtitle="Deadline & Janji Temu"
        currentClass={currentClass}
        onClassPress={onOpenSettings}
      />

      {/* Section Switcher: Tugas vs Meeting */}
      <View style={styles.sectionHeader}>
        <TouchableOpacity
          style={[styles.sectionBtn, section === 'tasks' && styles.activeSectionBtn]}
          onPress={() => setSection('tasks')}
        >
          <Text style={[styles.sectionBtnText, section === 'tasks' && styles.activeSectionBtnText]}>
            📝 Tugas Sekolah ({tasks.filter(t => !t.isCompleted).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sectionBtn, section === 'meetings' && styles.activeSectionBtn]}
          onPress={() => setSection('meetings')}
        >
          <Text style={[styles.sectionBtnText, section === 'meetings' && styles.activeSectionBtnText]}>
            📌 Janji Meeting ({meetings.filter(m => !m.isCompleted).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Filter Bar */}
      <View style={styles.dateFilterContainer}>
        {[
          { label: 'Semua Tanggal', value: 'all' as DateFilterType },
          { label: '📅 Hari Ini', value: 'today' as DateFilterType },
          { label: '⏰ Besok', value: 'tomorrow' as DateFilterType },
          { label: '🗓️ 7 Hari Kedepan', value: 'this_week' as DateFilterType },
        ].map(df => (
          <TouchableOpacity
            key={df.value}
            style={[styles.dateFilterChip, dateFilter === df.value && styles.activeDateFilterChip]}
            onPress={() => setDateFilter(df.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dateFilterText,
                dateFilter === df.value && styles.activeDateFilterText,
              ]}
            >
              {df.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Filter Tabs (Semua / Belum Selesai / Selesai) */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.activeFilterTab]}
            onPress={() => setFilter(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === tab && styles.activeFilterText]}>
              {tab === 'all' ? 'Semua Status' : tab === 'pending' ? 'Belum Selesai' : 'Selesai'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollArea}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.listContainer}>
          {section === 'tasks' ? (
            filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <View
                  key={task.id}
                  style={[styles.card, task.isCompleted && styles.completedCard]}
                >
                  <View style={styles.cardHeader}>
                    <TouchableOpacity
                      style={[styles.checkbox, task.isCompleted && styles.checkboxActive]}
                      onPress={() => handleToggleTaskComplete(task.id)}
                    >
                      {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                      <Text
                        style={[styles.title, task.isCompleted && styles.completedText]}
                      >
                        {task.title}
                      </Text>
                      <Text style={styles.subjectBadge}>📖 {task.subject}</Text>
                      <Text style={styles.dateTime}>
                        ⏰ Deadline: **{task.deadlineDate} pukul {task.deadlineTime} WIB**
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    {task.attachedFileName ? (
                      <TouchableOpacity
                        style={styles.fileBox}
                        onPress={() => handleOpenFile(task.attachedFileUri)}
                      >
                        <Text style={styles.fileIcon}>📎</Text>
                        <Text style={styles.fileNameText} numberOfLines={1}>
                          {task.attachedFileName}
                        </Text>
                        <Text style={styles.fileOpenHint}>Buka ↗</Text>
                      </TouchableOpacity>
                    ) : null}

                    {task.description ? (
                      <Text style={styles.notesText}>{task.description}</Text>
                    ) : null}
                  </View>

                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                    >
                      <Text style={styles.editBtn}>✏️ Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                      <Text style={styles.deleteBtn}>🗑️ Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyTitle}>Tidak Ada Tugas Ditemukan</Text>
                <Text style={styles.emptySubtitle}>
                  Tidak ada tugas yang sesuai dengan filter tanggal atau status yang Anda pilih.
                </Text>
              </View>
            )
          ) : (
            filteredMeetings.length > 0 ? (
              filteredMeetings.map(meeting => (
                <View
                  key={meeting.id}
                  style={[styles.card, meeting.isCompleted && styles.completedCard]}
                >
                  <View style={styles.cardHeader}>
                    <TouchableOpacity
                      style={[styles.checkbox, meeting.isCompleted && styles.checkboxActive]}
                      onPress={() => handleToggleMeetingComplete(meeting.id)}
                    >
                      {meeting.isCompleted && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                      <Text
                        style={[styles.title, meeting.isCompleted && styles.completedText]}
                      >
                        {meeting.title}
                      </Text>
                      <Text style={styles.dateTime}>
                        📅 {meeting.date} • ⏰ {meeting.time} WIB
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.locationBadge}>
                      <Text style={styles.locationText}>📍 {meeting.location}</Text>
                    </View>

                    {meeting.notes ? (
                      <Text style={styles.notesText}>{meeting.notes}</Text>
                    ) : null}
                  </View>

                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedMeeting(meeting);
                        setShowMeetingModal(true);
                      }}
                    >
                      <Text style={styles.editBtn}>✏️ Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDeleteMeeting(meeting.id)}>
                      <Text style={styles.deleteBtn}>🗑️ Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📌</Text>
                <Text style={styles.emptyTitle}>Belum Ada Meeting Ditemukan</Text>
                <Text style={styles.emptySubtitle}>
                  Tidak ada jadwal janji temu untuk filter tanggal yang dipilih.
                </Text>
              </View>
            )
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (section === 'tasks') {
            setSelectedTask(undefined);
            setShowTaskModal(true);
          } else {
            setSelectedMeeting(undefined);
            setShowMeetingModal(true);
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <TaskModal
        visible={showTaskModal}
        initialData={selectedTask}
        onClose={() => setShowTaskModal(false)}
        onSave={handleSaveTask}
      />

      <MeetingModal
        visible={showMeetingModal}
        initialData={selectedMeeting}
        onClose={() => setShowMeetingModal(false)}
        onSave={handleSaveMeeting}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  sectionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSectionBtn: {
    borderBottomColor: COLORS.primary,
  },
  sectionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  activeSectionBtnText: {
    color: COLORS.primary,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  dateFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeDateFilterChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  dateFilterText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeDateFilterText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 6,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeFilterText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  completedCard: {
    opacity: 0.6,
    backgroundColor: '#FAFAFA',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  subjectBadge: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  dateTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  cardBody: {
    marginTop: 10,
    paddingLeft: 36,
    gap: 6,
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  fileIcon: {
    fontSize: 14,
  },
  fileNameText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
  },
  fileOpenHint: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  locationBadge: {
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textBody,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  editBtn: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
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
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIcon: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: -2,
  },
});
