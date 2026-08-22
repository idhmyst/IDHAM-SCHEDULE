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
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../constants/theme';
import { TaskAssignment } from '../types';

interface TaskModalProps {
  visible: boolean;
  initialData?: Partial<TaskAssignment>;
  onClose: () => void;
  onSave: (task: TaskAssignment) => void;
}

const QUICK_DATE_PRESETS = [
  { label: 'Hari Ini', offsetDays: 0 },
  { label: 'Besok', offsetDays: 1 },
  { label: 'Lusa', offsetDays: 2 },
  { label: '+3 Hari', offsetDays: 3 },
  { label: '1 Minggu', offsetDays: 7 },
];

const QUICK_TIME_PRESETS = ['23:59', '17:00', '14:00', '12:00', '07:00'];

const QUICK_SUBJECT_PRESETS = [
  'Matematika (MTK-4)',
  'Konsentrasi Kejuruan (MP1-C)',
  'Bahasa Inggris (ING-1)',
  'Bahasa Indonesia (INA-4)',
  'Pendidikan Agama (PAI-3)',
  'PKK / Kewirausahaan',
];

const REMINDER_OPTIONS = [
  { label: '5 Menit', minutes: 5 },
  { label: '10 Menit', minutes: 10 },
  { label: '15 Menit', minutes: 15 },
  { label: '30 Menit', minutes: 30 },
  { label: '1 Jam', minutes: 60 },
  { label: '1 Hari (H-1)', minutes: 1440 },
  { label: '1 Minggu (H-7)', minutes: 10080 },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  initialData,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Matematika (MTK-4)');
  const [deadlineDate, setDeadlineDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([15, 60, 1440]);

  // Sync and retain old data whenever modal opens or initialData changes
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title || '');
        setSubject(initialData.subject || 'Matematika (MTK-4)');
        setDeadlineDate(initialData.deadlineDate || new Date().toISOString().split('T')[0]);
        setDeadlineTime(initialData.deadlineTime || '23:59');
        setDescription(initialData.description || '');
        setFileName(initialData.attachedFileName || '');
        setFileUri(initialData.attachedFileUri || '');
        setSelectedOffsets(
          initialData.notifyOffsets && initialData.notifyOffsets.length > 0
            ? initialData.notifyOffsets
            : [15, 60, 1440]
        );
      } else {
        setTitle('');
        setSubject('Matematika (MTK-4)');
        setDeadlineDate(new Date().toISOString().split('T')[0]);
        setDeadlineTime('23:59');
        setDescription('');
        setFileName('');
        setFileUri('');
        setSelectedOffsets([15, 60, 1440]);
      }
    }
  }, [visible, initialData]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileName(asset.name);
        setFileUri(asset.uri);
      }
    } catch (err) {
      console.error('Error picking document', err);
      Alert.alert('Error', 'Gagal memilih dokumen.');
    }
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileUri('');
  };

  const setPresetDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDeadlineDate(d.toISOString().split('T')[0]);
  };

  const toggleReminderOffset = (minutes: number) => {
    if (selectedOffsets.includes(minutes)) {
      setSelectedOffsets(selectedOffsets.filter(m => m !== minutes));
    } else {
      setSelectedOffsets([...selectedOffsets, minutes].sort((a, b) => a - b));
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Judul Diperlukan', 'Silakan masukkan judul tugas.');
      return;
    }

    const newTask: TaskAssignment = {
      id: initialData?.id || Date.now().toString(),
      title: title.trim(),
      subject: subject.trim(),
      deadlineDate: deadlineDate.trim(),
      deadlineTime: deadlineTime.trim(),
      description: description.trim() || undefined,
      attachedFileName: fileName || undefined,
      attachedFileUri: fileUri || undefined,
      notifyOffsets: selectedOffsets,
      isCompleted: initialData?.isCompleted || false,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSave(newTask);
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
              {initialData?.id ? '✏️ Edit Tugas Sekolah' : '📝 Tambah Tugas Baru'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Judul Tugas */}
            <Text style={styles.label}>Judul Tugas / PR *</Text>
            <TextInput
              style={styles.input}
              placeholder="cth: Kerjakan Latihan Bab 3 Hal 45"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
            />

            {/* Mata Pelajaran */}
            <Text style={styles.label}>Mata Pelajaran</Text>
            <TextInput
              style={styles.input}
              placeholder="Mata Pelajaran"
              placeholderTextColor={COLORS.textLight}
              value={subject}
              onChangeText={setSubject}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {QUICK_SUBJECT_PRESETS.map((sub, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.presetChip, subject === sub && styles.activePresetChip]}
                  onPress={() => setSubject(sub)}
                >
                  <Text style={[styles.presetChipText, subject === sub && styles.activePresetChipText]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tanggal Deadline */}
            <Text style={styles.label}>Tanggal Batas Pengumpulan (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-08-23"
              placeholderTextColor={COLORS.textLight}
              value={deadlineDate}
              onChangeText={setDeadlineDate}
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

            {/* Jam Deadline */}
            <Text style={styles.label}>Jam Deadline (HH:mm WIB)</Text>
            <TextInput
              style={styles.input}
              placeholder="23:59"
              placeholderTextColor={COLORS.textLight}
              value={deadlineTime}
              onChangeText={setDeadlineTime}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {QUICK_TIME_PRESETS.map((time, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.presetChip, deadlineTime === time && styles.activePresetChip]}
                  onPress={() => setDeadlineTime(time)}
                >
                  <Text style={[styles.presetChipText, deadlineTime === time && styles.activePresetChipText]}>
                    ⏰ {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Pengaturan Pengingat (Multi-Select) */}
            <Text style={styles.label}>🔔 Pengingat Alarm Sebelum Deadline (Bisa pilih lebih dari 1):</Text>
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

            {/* Lampirkan Dokumen */}
            <Text style={styles.label}>Lampiran File Tugas (PDF, Foto, Catatan)</Text>
            {fileName ? (
              <View style={styles.attachedFileBox}>
                <Text style={styles.attachedIcon}>📎</Text>
                <Text style={styles.attachedFileName} numberOfLines={1}>
                  {fileName}
                </Text>
                <TouchableOpacity onPress={handleRemoveFile}>
                  <Text style={styles.removeFileText}>✕ Hapus</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.pickFileBtn}
                onPress={handlePickDocument}
                activeOpacity={0.8}
              >
                <Text style={styles.pickFileIcon}>📎</Text>
                <Text style={styles.pickFileText}>Pilih File Dokumen / Soal Tugas</Text>
              </TouchableOpacity>
            )}

            {/* Catatan / Deskripsi Tambahan */}
            <Text style={styles.label}>Instruksi / Catatan Tambahan (Opsional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tambahkan catatan khusus pengerjaan..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Simpan Tugas</Text>
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
  attachedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  attachedIcon: {
    fontSize: 14,
  },
  attachedFileName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
  },
  removeFileText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  pickFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 6,
  },
  pickFileIcon: {
    fontSize: 14,
  },
  pickFileText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
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
