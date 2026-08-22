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

  // Sync and retain old data whenever modal opens
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setTime(initialData.time || '14:00');
        setLocation(initialData.location || 'Ruang Guru / Kelas');
        setNotes(initialData.notes || '');
      } else {
        setTitle('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime('14:00');
        setLocation('Ruang Guru / Kelas');
        setNotes('');
      }
    }
  }, [visible, initialData]);

  const handleApplyDatePreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const dateStr = target.toISOString().split('T')[0];
    setDate(dateStr);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const newMeeting: MeetingAgenda = {
      id: initialData?.id || Date.now().toString(),
      title: title.trim(),
      date: date.trim(),
      time: time.trim(),
      location: location.trim() || 'Sekolah',
      notes: notes.trim() || undefined,
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
              {initialData?.id ? '✏️ Edit Janji Meeting' : '📌 Tambah Janji Meeting'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Judul Agenda / Meeting *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Meeting Proyek Kelompok"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
            />

            {/* Quick Date Presets */}
            <Text style={styles.label}>Pilih Tanggal (Klik Tombol / Ketik YYYY-MM-DD)</Text>
            <View style={styles.datePresetsRow}>
              {QUICK_DATE_PRESETS.map((dp, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.datePresetChip}
                  onPress={() => handleApplyDatePreset(dp.offsetDays)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.datePresetText}>⚡ {dp.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <TextInput
                  style={styles.input}
                  placeholder="2026-08-25"
                  placeholderTextColor={COLORS.textLight}
                  value={date}
                  onChangeText={setDate}
                />
              </View>

              <View style={styles.col}>
                <TextInput
                  style={styles.input}
                  placeholder="14:00"
                  placeholderTextColor={COLORS.textLight}
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

            {/* Quick Time Presets */}
            <View style={styles.timePresetsRow}>
              {QUICK_TIME_PRESETS.map((t, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.timeChip, time === t && styles.activeTimeChip]}
                  onPress={() => setTime(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeChipText, time === t && styles.activeTimeChipText]}>
                    ⏰ {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Locations */}
            <Text style={styles.label}>Lokasi Pertemuan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {QUICK_LOCATIONS.map((loc, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.locChip, location === loc && styles.activeLocChip]}
                  onPress={() => setLocation(loc)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.locChipText, location === loc && styles.activeLocChipText]}>
                    📍 {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.input, { marginTop: 6 }]}
              placeholder="Atau ketik lokasi lain..."
              placeholderTextColor={COLORS.textLight}
              value={location}
              onChangeText={setLocation}
            />

            <Text style={styles.label}>Catatan Tambahan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Bawa laptop dan berkas dokumen..."
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
              <Text style={styles.saveBtnText}>
                {initialData?.id ? 'Perbarui Agenda' : 'Simpan Agenda'}
              </Text>
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
    maxHeight: '88%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  closeText: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
    marginTop: 10,
  },
  datePresetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  datePresetChip: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  datePresetText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  timePresetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  timeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTimeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeChipText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeTimeChipText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  locChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeLocChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  locChipText: {
    fontSize: 11,
    color: COLORS.textBody,
    fontWeight: '600',
  },
  activeLocChipText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.textDark,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
