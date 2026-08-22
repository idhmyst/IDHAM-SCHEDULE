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

          <ScrollView style={styles.body}>
            <Text style={styles.label}>Judul Agenda / Meeting *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Meeting Proyek Kelompok"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Tanggal (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-08-25"
                  placeholderTextColor={COLORS.textLight}
                  value={date}
                  onChangeText={setDate}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Waktu (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="14:00"
                  placeholderTextColor={COLORS.textLight}
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

            <Text style={styles.label}>Lokasi Pertemuan</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Ruang Sentra / Lab RPL"
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
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textBody,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
