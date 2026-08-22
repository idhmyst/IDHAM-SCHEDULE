import React, { useState } from 'react';
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

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  initialData,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [subject, setSubject] = useState(initialData?.subject || 'Matematika (MTK-4)');
  const [deadlineDate, setDeadlineDate] = useState(
    initialData?.deadlineDate || new Date().toISOString().split('T')[0]
  );
  const [deadlineTime, setDeadlineTime] = useState(initialData?.deadlineTime || '23:59');
  const [description, setDescription] = useState(initialData?.description || '');
  const [fileName, setFileName] = useState(initialData?.attachedFileName || '');
  const [fileUri, setFileUri] = useState(initialData?.attachedFileUri || '');

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
      isCompleted: false,
      createdAt: new Date().toISOString(),
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
            <Text style={styles.headerTitle}>📝 Tambah / Edit Tugas Sekolah</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Judul Tugas *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Latihan Soal Bab 3 Halaman 45"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Mata Pelajaran</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Matematika (MTK-4) / PAI / Kejuruan"
              placeholderTextColor={COLORS.textLight}
              value={subject}
              onChangeText={setSubject}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Deadline Tanggal (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-08-25"
                  placeholderTextColor={COLORS.textLight}
                  value={deadlineDate}
                  onChangeText={setDeadlineDate}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Deadline Jam (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="23:59"
                  placeholderTextColor={COLORS.textLight}
                  value={deadlineTime}
                  onChangeText={setDeadlineTime}
                />
              </View>
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
              placeholder="Format PDF, dikirim ke Google Classroom sebelum jam 12 malam..."
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
    maxHeight: '90%',
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
  pickFileBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  pickFileText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  attachedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    borderRadius: 12,
    padding: 10,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  fileIcon: {
    fontSize: 16,
  },
  fileNameText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
  },
  removeFileText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 'bold',
    marginLeft: 8,
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
