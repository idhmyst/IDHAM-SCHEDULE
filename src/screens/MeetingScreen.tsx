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
} from 'react-native';
import { COLORS } from '../constants/theme';
import { MeetingAgenda } from '../types';
import { Header } from '../components/Header';
import { MeetingModal } from '../components/MeetingModal';
import { StorageService } from '../services/storage';

interface MeetingScreenProps {
  currentClass: string;
  onOpenSettings?: () => void;
}

export const MeetingScreen: React.FC<MeetingScreenProps> = ({
  currentClass,
  onOpenSettings,
}) => {
  const [meetings, setMeetings] = useState<MeetingAgenda[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingAgenda | undefined>(undefined);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    const data = await StorageService.getMeetings();
    setMeetings(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMeetings();
    setRefreshing(false);
  };

  const handleToggleComplete = async (id: string) => {
    await StorageService.toggleMeetingCompleted(id);
    await loadMeetings();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Hapus Agenda', 'Apakah Anda yakin ingin menghapus agenda meeting ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await StorageService.deleteMeeting(id);
          await loadMeetings();
        },
      },
    ]);
  };

  const handleSaveMeeting = async (meeting: MeetingAgenda) => {
    await StorageService.saveMeeting(meeting);
    await loadMeetings();
  };

  const filteredMeetings = meetings.filter(m => {
    if (filter === 'upcoming') return !m.isCompleted;
    if (filter === 'completed') return m.isCompleted;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="AGENDA & MEETING"
        subtitle="Kelola Janji Temu"
        currentClass={currentClass}
        onClassPress={onOpenSettings}
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'upcoming', 'completed'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.activeFilterTab]}
            onPress={() => setFilter(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === tab && styles.activeFilterText]}>
              {tab === 'all' ? 'Semua' : tab === 'upcoming' ? 'Mendatang' : 'Selesai'}
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
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map(meeting => (
              <View
                key={meeting.id}
                style={[styles.card, meeting.isCompleted && styles.completedCard]}
              >
                <View style={styles.cardHeader}>
                  <TouchableOpacity
                    style={[styles.checkbox, meeting.isCompleted && styles.checkboxActive]}
                    onPress={() => handleToggleComplete(meeting.id)}
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
                      setShowModal(true);
                    }}
                  >
                    <Text style={styles.editBtn}>✏️ Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDelete(meeting.id)}>
                    <Text style={styles.deleteBtn}>🗑️ Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>Belum Ada Agenda</Text>
              <Text style={styles.emptySubtitle}>
                Gunakan tombol tambah (+) atau ketik perintah di chat bot untuk membuat agenda baru.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setSelectedMeeting(undefined);
          setShowModal(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <MeetingModal
        visible={showModal}
        initialData={selectedMeeting}
        onClose={() => setShowModal(false)}
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
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
    opacity: 0.65,
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
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  dateTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  cardBody: {
    marginTop: 10,
    paddingLeft: 36,
  },
  locationBadge: {
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
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
