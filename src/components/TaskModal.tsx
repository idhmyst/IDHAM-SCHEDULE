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
      } else {
        setTitle('');
        setSubject('Matematika (MTK-4)');
        setDeadlineDate(new Date().toISOString().split('T')[0]);
        setDeadlineTime('23:59');
        setDescription('');
        setFileName('');
        setFileUri('');
      }
    }
  }, [visible, initialData]);

  const handleApplyDatePreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const dateStr = target.toISOString().split('T')[0];
    setDeadlineDate(dateStr);
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setFileName(asset.name);
        setFileUri(asset.uri || '');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Gagal Membuka File', 'Tidak dapat memilih dokumen.');
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Data Belum Lengkap', 'Judul tugas wajib diisi.');
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
              {initialData?.id ? '✏️ Edit Tugas Sekolah' : '📝 Tambah Tugas Sekolah'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Judul */}
            <Text style={styles.label}>Judul Tugas *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Latihan Soal Bab 3 Halaman 45"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
            />

            {/* Quick Mapel Presets */}
            <Text style={styles.label}>Pilih Mata Pelajaran (Sekali Pencet)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {QUICK_SUBJECT_PRESETS.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.subjectChip, subject === s && styles.activeSubjectChip]}
                  onPress={() => setSubject(s)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.subjectChipText, subject === s && styles.activeSubjectChipText]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.input, { marginTop: 6 }]}
              placeholder="Atau ketik mapel lain..."
              placeholderTextColor={COLORS.textLight}
              value={subject}
              onChangeText={setSubject}
            />

            {/* Quick Date Presets */}
            <Text style={styles.label}>Deadline Tanggal (Klik Tombol / Ketik YYYY-MM-DD)</Text>
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
                  value={deadlineDate}
                  onChangeText={setDeadlineDate}
                />
              </View>

              <View style={styles.col}>
                <TextInput
                  style={styles.input}
                  placeholder="23:59"
                  placeholderTextColor={COLORS.textLight}
                  value={deadlineTime}
                  onChangeText={setDeadlineTime}
                />
              </View>
            </View>

            {/* Quick Time Presets */}
            <View style={styles.timePresetsRow}>
              {QUICK_TIME_PRESETS.map((t, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.timeChip, deadlineTime === t && styles.activeTimeChip]}
                  onPress={() => setDeadlineTime(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeChipText, deadlineTime === t && styles.activeTimeChipText]}>
                    ⏰ {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Lampiran Dokumen Tugas */}
            <Text style={styles.label}>Lampiran File Tugas (PDF, Docx, Foto Soal)</Text>
            {fileName ? (
              <View style={styles.attachedFileBox}>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileIcon}>📎</Text>
                  <Text style={styles.fileNameText} numberOfLines={1}>
                    {fileName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setFileName('');
                    setFileUri('');
                  }}
                >
                  <Text style={styles.removeFileText}>✕ Hapus</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.pickFileBtn} onPress={handlePickDocument}>
                <Text style={styles.pickFileText}>📎 Pilih File Tugas dari HP</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.label}>Catatan & Instruksi Guru</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Format PDF, dikirim ke Google Classroom..."
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
              <Text style={styles.saveBtnText}>
                {initialData?.id ? 'Perbarui Tugas' : 'Simpan Tugas'}
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
    maxHeight: '92%',
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
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  subjectChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeSubjectChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  subjectChipText: {
    fontSize: 11,
    color: COLORS.textBody,
    fontWeight: '600',
  },
  activeSubjectChipText: {
    color: COLORS.primary,
    fontWeight: 'bold',
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
  pickFileBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  pickFileText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  attachedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    borderRadius: 12,
    padding: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  removeFileText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: 'bold',
    marginLeft: 6,
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
