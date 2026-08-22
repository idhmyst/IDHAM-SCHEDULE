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
import { DayName, ScheduleOverride } from '../types';

interface OverrideModalProps {
  visible: boolean;
  className: string;
  initialData?: {
    day?: DayName;
    period?: number;
    currentSubject?: string;
    currentRoom?: string;
    note?: string;
  };
  onClose: () => void;
  onSave: (override: ScheduleOverride) => void;
}

export const OverrideModal: React.FC<OverrideModalProps> = ({
  visible,
  className,
  initialData,
  onClose,
  onSave,
}) => {
  const [day, setDay] = useState<DayName>('senin');
  const [period, setPeriod] = useState('1');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [room, setRoom] = useState('');
  const [note, setNote] = useState('');

  // Retain & pre-fill existing schedule data
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setDay(initialData.day || 'senin');
        setPeriod(initialData.period ? initialData.period.toString() : '1');
        setSubjectName(initialData.currentSubject || '');
        setRoom(initialData.currentRoom || '');
        setNote(initialData.note || '');
      } else {
        setDay('senin');
        setPeriod('1');
        setSubjectName('');
        setSubjectCode('');
        setRoom('');
        setNote('');
      }
    }
  }, [visible, initialData]);

  const daysList: { key: DayName; label: string }[] = [
    { key: 'senin', label: 'Senin' },
    { key: 'selasa', label: 'Selasa' },
    { key: 'rabu', label: 'Rabu' },
    { key: 'kamis', label: 'Kamis' },
    { key: 'jumat', label: 'Jumat' },
  ];

  const handleSave = () => {
    const override: ScheduleOverride = {
      id: Date.now().toString(),
      className,
      day,
      period: parseInt(period, 10) || 1,
      newSubjectName: subjectName.trim() || undefined,
      newSubjectCode: subjectCode.trim() || undefined,
      newRoom: room.trim() || undefined,
      note: note.trim() || 'Perubahan Mandiri',
      createdAt: new Date().toISOString(),
    };

    onSave(override);
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
            <Text style={styles.headerTitle}>✏️ Ubah / Override Jadwal Kelas</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <Text style={styles.label}>Pilih Hari</Text>
            <View style={styles.daySelector}>
              {daysList.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.dayChip, day === d.key && styles.activeDayChip]}
                  onPress={() => setDay(d.key)}
                >
                  <Text style={[styles.dayChipText, day === d.key && styles.activeDayChipText]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Jam ke (1 - 11)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 3"
              placeholderTextColor={COLORS.textLight}
              keyboardType="number-pad"
              value={period}
              onChangeText={setPeriod}
            />

            <Text style={styles.label}>Nama Mapel</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Bimbingan Konseling / Free / Praktik"
              placeholderTextColor={COLORS.textLight}
              value={subjectName}
              onChangeText={setSubjectName}
            />

            <Text style={styles.label}>Kode Mapel Baru (Opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: BK-2, FREE, PRAKTIK"
              placeholderTextColor={COLORS.textLight}
              value={subjectCode}
              onChangeText={setSubjectCode}
            />

            <Text style={styles.label}>Ruangan Kelas</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Lab RPL 2 / RPS UTR / B.3.2"
              placeholderTextColor={COLORS.textLight}
              value={room}
              onChangeText={setRoom}
            />

            <Text style={styles.label}>Alasan / Keterangan Perubahan</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Guru berhalangan hadir / Pindah lab"
              placeholderTextColor={COLORS.textLight}
              value={note}
              onChangeText={setNote}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Terapkan Perubahan</Text>
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
  daySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeDayChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayChipText: {
    fontSize: 12,
    color: COLORS.textBody,
    fontWeight: '600',
  },
  activeDayChipText: {
    color: COLORS.white,
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
