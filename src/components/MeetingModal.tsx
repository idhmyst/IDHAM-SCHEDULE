import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { MeetingAgenda } from '../types';

interface MeetingModalProps {
  visible: boolean;
  initialData?: Partial<MeetingAgenda>;
  onClose: () => void;
  onSave: (meeting: MeetingAgenda) => void;
}

const QUICK_DATE_PRESETS = [
  { label: 'Hari Ini', offsetDays: 0 },
  { label: 'Besok', offsetDays: 1 },
  { label: 'Lusa', offsetDays: 2 },
  { label: '+3 Hari', offsetDays: 3 },
  { label: '1 Minggu', offsetDays: 7 },
];

const QUICK_TIME_PRESETS = ['08:00', '10:00', '13:00', '14:00', '15:30', '19:00'];

const QUICK_LOCATIONS = ['Ruang Guru', 'Lab RPL 2', 'Ruang Sentra', 'Kelas XII PPLG 3', 'Online (GMeet)'];

const REMINDER_OPTIONS = [
  { label: '5 Menit', minutes: 5 },
  { label: '10 Menit', minutes: 10 },
  { label: '15 Menit', minutes: 15 },
  { label: '30 Menit', minutes: 30 },
  { label: '1 Jam', minutes: 60 },
  { label: '1 Hari (H-1)', minutes: 1440 },
  { label: '1 Minggu (H-7)', minutes: 10080 },
];

export const MeetingModal: React.FC<MeetingModalProps> = ({
  visible,
  initialData,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [location, setLocation] = useState('Ruang Guru / Kelas');
  const [notes, setNotes] = useState('');
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([15, 60]);

  // Sync and retain old data whenever modal opens
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setTime(initialData.time || '14:00');
        setLocation(initialData.location || 'Ruang Guru / Kelas');
        setNotes(initialData.notes || '');
        setSelectedOffsets(
          initialData.notifyOffsets && initialData.notifyOffsets.length > 0
            ? initialData.notifyOffsets
            : [15, 60]
        );
      } else {
        setTitle('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime('14:00');
        setLocation('Ruang Guru / Kelas');
        setNotes('');
        setSelectedOffsets([15, 60]);
      }
    }
  }, [visible, initialData]);

  const setPresetDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d.toISOString().split('T')[0]);
  };

  const toggleReminderOffset = (minutes: number) => {
    if (selectedOffsets.includes(minutes)) {
      setSelectedOffsets(selectedOffsets.filter(m => m !== minutes));
    } else {
      setSelectedOffsets([...selectedOffsets, minutes].sort((a, b) => a - b));
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const newMeeting: MeetingAgenda = {
      id: initialData?.id || Date.now().toString(),
      title: title.trim(),
      date: date.trim(),
      time: time.trim(),
      location: location.trim(),
      notes: notes.trim() || undefined,
      notifyOffsets: selectedOffsets,
      isCompleted: initialData?.isCompleted || false,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSave(newMeeting);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {initialData?.id ? '✏️ Edit Jadwal Meeting' : '📌 Tambah Janji Meeting'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Judul Meeting */}
            <Text style={styles.label}>Judul Pertemuan / Agenda *</Text>
            <TextInput
              style={styles.input}
              placeholder="cth: Evaluasi Projek PKL / Konseling"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
            />

            {/* Tanggal Meeting */}
            <Text style={styles.label}>Tanggal (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-08-23"
              placeholderTextColor={COLORS.textLight}
              value={date}
              onChangeText={setDate}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {QUICK_DATE_PRESETS.map((preset, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.datePresetChip}
                  onPress={() => setPresetDate(preset.offsetDays)}
                >
                  <Text style={styles.datePresetText}>⚡ {preset.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Waktu Meeting */}
            <Text style={styles.label}>Waktu (HH:mm WIB)</Text>
            <TextInput
              style={styles.input}
              placeholder="14:00"
              placeholderTextColor={COLORS.textLight}
              value={time}
              onChangeText={setTime}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {QUICK_TIME_PRESETS.map((t, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.presetChip, time === t && styles.activePresetChip]}
                  onPress={() => setTime(t)}
                >
                  <Text style={[styles.presetChipText, time === t && styles.activePresetChipText]}>
                    ⏰ {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Lokasi Meeting */}
            <Text style={styles.label}>Tempat / Lokasi Pertemuan</Text>
            <TextInput
              style={styles.input}
              placeholder="Ruang Guru / Lab RPL"
              placeholderTextColor={COLORS.textLight}
              value={location}
              onChangeText={setLocation}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {QUICK_LOCATIONS.map((loc, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.presetChip, location === loc && styles.activePresetChip]}
                  onPress={() => setLocation(loc)}
                >
                  <Text style={[styles.presetChipText, location === loc && styles.activePresetChipText]}>
                    📍 {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Pengaturan Pengingat (Multi-Select) */}
            <Text style={styles.label}>🔔 Pengingat Alarm Sebelum Meeting (Bisa pilih lebih dari 1):</Text>
            <View style={styles.reminderOptionsGrid}>
              {REMINDER_OPTIONS.map(opt => {
                const isSelected = selectedOffsets.includes(opt.minutes);
                return (
                  <TouchableOpacity
                    key={opt.minutes}
                    style={[styles.reminderChip, isSelected && styles.activeReminderChip]}
                    onPress={() => toggleReminderOffset(opt.minutes)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.reminderChipCheck, isSelected && styles.activeReminderChipCheck]}>
                      {isSelected ? '☑' : '☐'}
                    </Text>
                    <Text style={[styles.reminderChipText, isSelected && styles.activeReminderChipText]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Catatan / Keterangan */}
            <Text style={styles.label}>Catatan Tambahan (Opsional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Bawa laporan proposal magang..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Simpan Jadwal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  closeText: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: COLORS.textDark,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  presetsRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 4,
  },
  presetChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  activePresetChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  presetChipText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activePresetChipText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  datePresetChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  datePresetText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  reminderOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  reminderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  activeReminderChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  reminderChipCheck: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  activeReminderChipCheck: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  reminderChipText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeReminderChipText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 6,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 11,
  },
});
