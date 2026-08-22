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
} from 'react-native';
import { COLORS } from '../constants/theme';
import { ChatMessage, MeetingAgenda, ScheduleOverride } from '../types';
import { ChatBubble } from '../components/ChatBubble';
import { QuickChips } from '../components/QuickChips';
import { Header } from '../components/Header';
import { MeetingModal } from '../components/MeetingModal';
import { OverrideModal } from '../components/OverrideModal';
import { generateBotResponse } from '../bot/responseFormatter';
import { StorageService } from '../services/storage';

interface ChatScreenProps {
  currentClass: string;
  onOpenSettings?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ currentClass, onOpenSettings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideModalData, setOverrideModalData] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    const saved = await StorageService.getChats();
    if (saved && saved.length > 0) {
      setMessages(saved);
    } else {
      // Initial Welcome Message
      const welcomeMsg: ChatMessage = {
        id: '1',
        sender: 'bot',
        text: `Halo Idham! 👋\n\nSaya asisten jadwal offline Anda untuk kelas **${currentClass}** (SMK Telkom Purwokerto).\n\nAnda bisa bertanya jadwal ruangan, mata pelajaran hari Senin-Jumat, seragam harian, hingga mencatat janji meeting dan agenda Anda di sini.`,
        timestamp: formatCurrentTime(),
        quickReplies: ['📅 Jadwal Hari Ini', '📍 Ruangan Sekarang', '👕 Seragam Hari Ini', '📋 Jadwal Besok'],
      };
      setMessages([welcomeMsg]);
      await StorageService.saveChats([welcomeMsg]);
    }
  };

  const formatCurrentTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
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

    // Generate Bot Response
    try {
      const botRes = await generateBotResponse(text, currentClass);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botRes.text,
        timestamp: formatCurrentTime(),
        quickReplies: botRes.quickReplies,
        actionType: botRes.actionType,
      };

      const updated = [...newMessages, botMsg];
      setMessages(updated);
      await StorageService.saveChats(updated);

      if (botRes.openModal === 'meeting') {
        setShowMeetingModal(true);
      } else if (botRes.openModal === 'override') {
        setOverrideModalData(botRes.modalData);
        setShowOverrideModal(true);
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
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      text: `✅ **Agenda Meeting Tersimpan!**\n\n📌 **${meeting.title}**\n📅 ${meeting.date} pukul ${meeting.time} WIB\n📍 Lokasi: ${meeting.location}`,
      timestamp: formatCurrentTime(),
      quickReplies: ['📋 Lihat Semua Meeting', '📅 Jadwal Hari Ini'],
    };
    const updated = [...messages, confirmMsg];
    setMessages(updated);
    await StorageService.saveChats(updated);
  };

  const handleSaveOverride = async (override: ScheduleOverride) => {
    await StorageService.saveOverride(override);
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      text: `✅ **Jadwal Berhasil Diperbarui!**\n\n📅 Hari: **${override.day.toUpperCase()}** (Jam ke-${override.period})\n🏫 Ruangan: **${override.newRoom || 'Sesuai'}**\n📖 Mapel: **${override.newSubjectName || override.newSubjectCode || 'Sesuai'}**\nℹ️ Catatan: *${override.note}*`,
      timestamp: formatCurrentTime(),
      quickReplies: [`📅 Cek Jadwal ${override.day}`, '📍 Ruangan Sekarang'],
    };
    const updated = [...messages, confirmMsg];
    setMessages(updated);
    await StorageService.saveChats(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="IDHAM SCHEDULE"
        subtitle="Offline Bot"
        currentClass={currentClass}
        onClassPress={onOpenSettings}
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
              onQuickReplyPress={reply => handleSendMessage(reply)}
            />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.typingText}>Bot sedang memproses...</Text>
          </View>
        )}

        <QuickChips onSelect={chip => handleSendMessage(chip)} />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ketik pertanyaan / perintah jadwal..."
            placeholderTextColor={COLORS.textLight}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSendMessage()}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});
