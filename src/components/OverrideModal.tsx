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

const DAYS_LIST: { key: DayName; label: string }[] = [
  { key: 'senin', label: 'Senin' },
  { key: 'selasa', label: 'Selasa' },
  { key: 'rabu', label: 'Rabu' },
  { key: 'kamis', label: 'Kamis' },
  { key: 'jumat', label: 'Jumat' },
];

const PERIOD_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const QUICK_PRESETS = [
  { name: 'Bimbingan Konseling', code: 'BK', room: 'B.3.2' },
  { name: 'Jam Kosong / Free Class', code: 'FREE', room: 'Kelas' },
  { name: 'Praktik Lab RPL', code: 'MP1-C', room: 'Lab RPL 2' },
  { name: 'Upacara / Apel Pagi', code: 'UPACARA', room: 'Lapangan' },
  { name: 'Senam & Olahraga', code: 'SENAM', room: 'Lapangan' },
  { name: 'Kewirausahaan (PKK)', code: 'PKK-2', room: 'RPS UTR' },
];

export const OverrideModal: React.FC<OverrideModalProps> = ({
  visible,
  className,
  initialData,
  onClose,
  onSave,
}) => {
  const [day, setDay] = useState<DayName>('senin');
  const [period, setPeriod] = useState(1);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [room, setRoom] = useState('');
  const [note, setNote] = useState('');

  // Retain & pre-fill existing schedule data
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setDay(initialData.day || 'senin');
        setPeriod(initialData.period || 1);
        setSubjectName(initialData.currentSubject || '');
        setRoom(initialData.currentRoom || '');
        setNote(initialData.note || '');
      } else {
        setDay('senin');
        setPeriod(1);
        setSubjectName('');
        setSubjectCode('');
        setRoom('');
        setNote('');
      }
    }
  }, [visible, initialData]);

  const handleApplyPreset = (preset: { name: string; code: string; room: string }) => {
    setSubjectName(preset.name);
    setSubjectCode(preset.code);
    setRoom(preset.room);
    setNote(`Diubah ke ${preset.name}`);
  };

  const handleSave = () => {
    const override: ScheduleOverride = {
      id: Date.now().toString(),
      className,
      day,
      period,
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
            <Text style={styles.headerTitle}>✏️ Ubah / Override Jadwal Pelajaran</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. Pilih Hari (Interactive Buttons) */}
            <Text style={styles.label}>1. Pilih Hari</Text>
            <View style={styles.chipsRow}>
              {DAYS_LIST.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.chipButton, day === d.key && styles.activeChipButton]}
                  onPress={() => setDay(d.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.chipButtonText, day === d.key && styles.activeChipButtonText]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 2. Pilih Jam ke- (Interactive Buttons 1-11) */}
            <Text style={styles.label}>2. Pilih Jam Pelajaran ke-</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
              {PERIOD_LIST.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodChip, period === p && styles.activePeriodChip]}
                  onPress={() => setPeriod(p)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.periodChipText, period === p && styles.activePeriodChipText]}
                  >
                    Jam {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 3. Preset Cepat (Quick Tap) */}
            <Text style={styles.label}>3. Opsi Cepat (Sekali Pencet)</Text>
            <View style={styles.presetWrap}>
              {QUICK_PRESETS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipText}>⚡ {item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 4. Form Rincian Mapel & Ruangan */}
            <Text style={styles.label}>4. Nama Mata Pelajaran</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Bimbingan Konseling / Free Class / Praktik"
              placeholderTextColor={COLORS.textLight}
              value={subjectName}
              onChangeText={setSubjectName}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Kode Mapel</Text>
                <TextInput
                  style={styles.input}
                  placeholder="BK-2 / FREE"
                  placeholderTextColor={COLORS.textLight}
                  value={subjectCode}
                  onChangeText={setSubjectCode}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Ruangan Kelas</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lab RPL 2 / B.3.2"
                  placeholderTextColor={COLORS.textLight}
                  value={room}
                  onChangeText={setRoom}
                />
              </View>
            </View>

            <Text style={styles.label}>Alasan / Catatan Perubahan</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Guru tugas luar / Pindah lab"
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
              <Text style={styles.saveBtnText}>Terapkan Jadwal</Text>
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
    maxHeight: '90%',
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
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
    marginTop: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chipButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  activeChipButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipButtonText: {
    fontSize: 12,
    color: COLORS.textBody,
    fontWeight: '600',
  },
  activeChipButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activePeriodChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodChipText: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  activePeriodChipText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  presetChipText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
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
