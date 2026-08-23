import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { ChatMessage, KnowledgeDocument, MeetingAgenda, ScheduleOverride, TaskAssignment } from '../types';
import { ChatBubble } from '../components/ChatBubble';
import { QuickChips } from '../components/QuickChips';
import { Header } from '../components/Header';
import { MeetingModal } from '../components/MeetingModal';
import { TaskModal } from '../components/TaskModal';
import { KnowledgeModal } from '../components/KnowledgeModal';
import { OverrideModal } from '../components/OverrideModal';
import { AttendanceModal } from '../components/AttendanceModal';
import { ReportModal } from '../components/ReportModal';
import { AuthModal } from '../components/AuthModal';
import { generateBotResponse } from '../bot/responseFormatter';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';

interface ChatScreenProps {
  currentClass: string;
  onOpenSettings?: () => void;
  onOpenAttendance?: () => void;
  onVoiceAIPress?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  currentClass,
  onOpenSettings,
  onOpenAttendance,
  onVoiceAIPress,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalData, setTaskModalData] = useState<any>(null);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideModalData, setOverrideModalData] = useState<any>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    const saved = await StorageService.getChats();
    if (saved && saved.length > 0) {
      setMessages(saved);
    } else {
      const welcomeMsg: ChatMessage = {
        id: '1',
        sender: 'bot',
        text: `Halo Idham! 👋\n\nSaya asisten jadwal, tugas & presensi offline untuk kelas **${currentClass}** (SMK Telkom Purwokerto).\n\n• Tanyakan jadwal kelas & ruangan.\n• Lakukan presensi mandiri (Absen Masuk/Pulang).\n• Cek insight kehadiran bulanan & download laporan PDF / Excel.\n• Masuk ke Akun Cloud Supabase agar data tidak hilang!`,
        timestamp: formatCurrentTime(),
        quickReplies: ['📅 Jadwal Hari Ini', '📍 Absen Online', '📊 Insight & PDF', '📝 Daftar Tugas', '☁️ Akun Cloud'],
      };
      setMessages([welcomeMsg]);
      await StorageService.saveChats([welcomeMsg]);
    }
  };

  const formatCurrentTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleOpenAttendanceAction = () => {
    if (onOpenAttendance) {
      onOpenAttendance();
    } else {
      setShowAttendanceModal(true);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: formatCurrentTime(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const botRes = await generateBotResponse(text, currentClass);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botRes.text,
        timestamp: formatCurrentTime(),
        quickReplies: botRes.quickReplies,
        actionType: (botRes.actionType as any) || 'general',
      };

      const updated = [...newMessages, botMsg];
      setMessages(updated);
      await StorageService.saveChats(updated);

      if (botRes.openModal === 'meeting') {
        setShowMeetingModal(true);
      } else if (botRes.openModal === 'task') {
        setTaskModalData(botRes.modalData);
        setShowTaskModal(true);
      } else if (botRes.openModal === 'knowledge') {
        setShowKnowledgeModal(true);
      } else if (botRes.openModal === 'override') {
        setOverrideModalData(botRes.modalData);
        setShowOverrideModal(true);
      } else if (botRes.openModal === 'attendance') {
        handleOpenAttendanceAction();
      } else if (botRes.openModal === 'report') {
        setShowReportModal(true);
      } else if (botRes.openModal === 'auth') {
        setShowAuthModal(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSaveMeeting = async (meeting: MeetingAgenda) => {
    await StorageService.saveMeeting(meeting);
    await NotificationService.scheduleAllReminders();
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      text: `✅ **Agenda Meeting Tersimpan!**\n\n📌 **${meeting.title}**\n📅 ${meeting.date} pukul ${meeting.time} WIB\n📍 Lokasi: ${meeting.location}\n\nPengingat telah aktif!`,
      timestamp: formatCurrentTime(),
      quickReplies: ['📋 Lihat Semua Agenda', '📅 Jadwal Hari Ini', '↩️ Batalkan'],
    };
    const updated = [...messages, confirmMsg];
    setMessages(updated);
    await StorageService.saveChats(updated);
  };

  const handleSaveTask = async (task: TaskAssignment) => {
    await StorageService.saveTask(task);
    await NotificationService.scheduleAllReminders();
    const fileText = task.attachedFileName ? `\n📎 File Lampiran: *${task.attachedFileName}*` : '';
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      text: `✅ **Tugas Berhasil Disimpan & Pengingat Aktif!**\n\n📝 **${task.title}** (${task.subject})\n⏰ Deadline: **${task.deadlineDate} pukul ${task.deadlineTime} WIB**` +
        fileText +
        `\n\nAnda akan diingatkan sebelum batas waktu pengumpulan tugas tiba.`,
      timestamp: formatCurrentTime(),
      quickReplies: ['📝 Lihat Semua Tugas', '📅 Jadwal Hari Ini', '↩️ Batalkan'],
    };
    const updated = [...messages, confirmMsg];
    setMessages(updated);
    await StorageService.saveChats(updated);
  };

  const handleLearnedDocument = async (doc: KnowledgeDocument) => {
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      text: `🧠 **Materi Baru Berhasil Dipelajari!**\n\n📄 **${doc.title}**\n*Sumber: ${doc.fileName}*\n\nSekarang Anda dapat menanyakan materi atau isi dari dokumen ini kapan saja!`,
      timestamp: formatCurrentTime(),
      quickReplies: [`Tanya tentang ${doc.title}`, '📝 Daftar Tugas', '📅 Jadwal Hari Ini'],
    };
    const updated = [...messages, confirmMsg];
    setMessages(updated);
    await StorageService.saveChats(updated);
  };

  const handleSaveOverride = async (override: ScheduleOverride) => {
    await StorageService.saveOverride(override);
    await NotificationService.scheduleAllReminders();
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      text: `✅ **Jadwal Berhasil Diperbarui!**\n\n📅 Hari: **${override.day.toUpperCase()}** (Jam ke-${override.period})\n🏫 Ruangan: **${override.newRoom || 'Sesuai'}**\n📖 Mapel: **${override.newSubjectName || override.newSubjectCode || 'Sesuai'}**`,
      timestamp: formatCurrentTime(),
      quickReplies: [`📅 Cek Jadwal ${override.day}`, '📍 Ruangan Sekarang', '↩️ Batalkan (Undo)'],
    };
    const updated = [...messages, confirmMsg];
    setMessages(updated);
    await StorageService.saveChats(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        subtitle="Offline AI Assistant"
        currentClass={currentClass}
        onClassPress={onOpenSettings}
        onAttendancePress={handleOpenAttendanceAction}
        onVoiceAIPress={onVoiceAIPress}
      />

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              onQuickReplyPress={reply => {
                if (reply === '📍 Buka Menu Presensi' || reply === '📍 Absen Online') {
                  handleOpenAttendanceAction();
                } else if (reply === '📄 Buka Laporan PDF' || reply === '📊 Insight & PDF') {
                  setShowReportModal(true);
                } else if (reply === '☁️ Buka Menu Cloud' || reply === '☁️ Akun Cloud') {
                  setShowAuthModal(true);
                } else {
                  handleSendMessage(reply);
                }
              }}
            />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.typingText}>Bot sedang memproses materi...</Text>
          </View>
        )}

        <QuickChips
          onSelect={chip => {
            if (chip === '📍 Absen Online') {
              handleOpenAttendanceAction();
            } else if (chip === '📊 Insight & PDF') {
              setShowReportModal(true);
            } else if (chip === '☁️ Akun Cloud') {
              setShowAuthModal(true);
            } else {
              handleSendMessage(chip);
            }
          }}
        />

        <View style={styles.inputBar}>
          {/* File Upload Button to Teach Bot */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => setShowKnowledgeModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>

          {/* Quick Attendance Icon */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleOpenAttendanceAction}
            activeOpacity={0.7}
          >
            <Text style={styles.attachIcon}>📍</Text>
          </TouchableOpacity>

          {/* Quick PDF Report Icon */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => setShowReportModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.attachIcon}>📊</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Tanya jadwal, absen, insight pdf, tugas..."
            placeholderTextColor={COLORS.textLight}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSendMessage()}
            returnKeyType="send"
          />

          {/* IDHAM AI Voice Trigger Button */}
          {onVoiceAIPress && (
            <TouchableOpacity
              style={styles.micBtn}
              onPress={onVoiceAIPress}
              activeOpacity={0.7}
            >
              <Text style={styles.micIcon}>🎙️</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <AttendanceModal
        visible={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
      />

      <KnowledgeModal
        visible={showKnowledgeModal}
        onClose={() => setShowKnowledgeModal(false)}
        onLearned={handleLearnedDocument}
      />

      <TaskModal
        visible={showTaskModal}
        initialData={taskModalData}
        onClose={() => setShowTaskModal(false)}
        onSave={handleSaveTask}
      />

      <MeetingModal
        visible={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        onSave={handleSaveMeeting}
      />

      <OverrideModal
        visible={showOverrideModal}
        className={currentClass}
        initialData={overrideModalData}
        onClose={() => setShowOverrideModal(false)}
        onSave={handleSaveOverride}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatArea: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 12,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachIcon: {
    fontSize: 15,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 12,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  sendIcon: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  micIcon: {
    fontSize: 15,
  },
});
