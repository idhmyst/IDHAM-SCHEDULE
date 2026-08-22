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
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { KnowledgeDocument } from '../types';
import { KnowledgeService } from '../services/knowledgeService';
import { StorageService } from '../services/storage';

interface KnowledgeModalProps {
  visible: boolean;
  onClose: () => void;
  onLearned: (doc: KnowledgeDocument) => void;
}

export const KnowledgeModal: React.FC<KnowledgeModalProps> = ({
  visible,
  onClose,
  onLearned,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'list'>('upload');
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);

  useEffect(() => {
    if (visible) {
      loadDocuments();
    }
  }, [visible]);

  const loadDocuments = async () => {
    const docs = await StorageService.getKnowledgeDocs();
    setDocuments(docs);
  };

  const handlePickDocument = async () => {
    setLoading(true);
    try {
      const doc = await KnowledgeService.pickAndLearnDocument();
      if (doc) {
        onLearned(doc);
        await loadDocuments();
        Alert.alert('Berhasil Dipelajari! 🧠', `Bot telah mempelajari materi dari file: "${doc.fileName}"`);
        onClose();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Gagal Membaca File', 'Terjadi kesalahan saat memproses dokumen.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTextKnowledge = async () => {
    if (!title.trim() || !textContent.trim()) {
      Alert.alert('Data Belum Lengkap', 'Judul dan isi materi catatan wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const doc = await KnowledgeService.addTextKnowledge(title.trim(), textContent.trim());
      onLearned(doc);
      await loadDocuments();
      setTitle('');
      setTextContent('');
      Alert.alert('Catatan Disimpan! 🧠', `Bot telah menyimpan materi baru: "${doc.title}"`);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    await StorageService.deleteKnowledgeDoc(id);
    await loadDocuments();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🧠 Ajari Bot Hal & Materi Baru</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Tab */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'upload' && styles.activeTabBtn]}
              onPress={() => setActiveTab('upload')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'upload' && styles.activeTabBtnText]}>
                📎 Upload File
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'text' && styles.activeTabBtn]}
              onPress={() => setActiveTab('text')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'text' && styles.activeTabBtnText]}>
                ✍️ Tulis Catatan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'list' && styles.activeTabBtn]}
              onPress={() => setActiveTab('list')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'list' && styles.activeTabBtnText]}>
                📚 Dokumen ({documents.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {activeTab === 'upload' && (
              <View style={styles.tabContent}>
                <Text style={styles.descText}>
                  Unggah file (PDF, Dokumen Teks, Catatan Kuliah/Sekolah) ke dalam sistem. Bot akan mengekstrak isinya dan menjawab pertanyaan Anda berdasarkan file tersebut secara offline!
                </Text>

                <TouchableOpacity
                  style={styles.bigUploadBtn}
                  onPress={handlePickDocument}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <>
                      <Text style={styles.uploadIcon}>📂</Text>
                      <Text style={styles.uploadBtnText}>Pilih Dokumen dari HP</Text>
                      <Text style={styles.uploadSubtext}>Mendukung PDF, TXT, JSON, MD</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'text' && (
              <View style={styles.tabContent}>
                <Text style={styles.label}>Topik / Judul Materi</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Rumus Matematika Bab Integral / Jadwal Piket"
                  placeholderTextColor={COLORS.textLight}
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.label}>Isi Pengetahuan / Materi</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ketik catatan penting yang ingin diingat oleh bot..."
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  numberOfLines={5}
                  value={textContent}
                  onChangeText={setTextContent}
                />

                <TouchableOpacity style={styles.saveNoteBtn} onPress={handleSaveTextKnowledge}>
                  <Text style={styles.saveNoteBtnText}>Ajarkan ke Bot</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'list' && (
              <View style={styles.tabContent}>
                {documents.length > 0 ? (
                  documents.map(doc => (
                    <View key={doc.id} style={styles.docItem}>
                      <View style={styles.docInfo}>
                        <Text style={styles.docTitle}>📄 {doc.title}</Text>
                        <Text style={styles.docSummary} numberOfLines={2}>
                          {doc.summary || doc.textContent}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteDoc(doc.id)}>
                        <Text style={styles.deleteDocBtn}>Hapus</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyDocs}>
                    <Text style={styles.emptyDocsIcon}>📭</Text>
                    <Text style={styles.emptyDocsText}>Belum ada file atau materi yang dipelajari bot.</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
              <Text style={styles.closeModalBtnText}>Tutup</Text>
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
    marginBottom: 12,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabBtn: {
    backgroundColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 12,
  },
  tabContent: {
    gap: 12,
  },
  descText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  bigUploadBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  uploadIcon: {
    fontSize: 36,
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  uploadSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textBody,
    marginTop: 4,
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
    height: 90,
    textAlignVertical: 'top',
  },
  saveNoteBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveNoteBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  docInfo: {
    flex: 1,
    paddingRight: 10,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  docSummary: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  deleteDocBtn: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 'bold',
    padding: 6,
  },
  emptyDocs: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyDocsIcon: {
    fontSize: 36,
  },
  emptyDocsText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  footer: {
    paddingTop: 10,
  },
  closeModalBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
