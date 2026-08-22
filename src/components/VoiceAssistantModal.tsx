import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { VoiceCommandResult, VoiceService } from '../services/voiceService';

interface VoiceAssistantModalProps {
  visible: boolean;
  currentClass: string;
  onClose: () => void;
  onExecuteAction?: (result: VoiceCommandResult) => void;
}

const VOICE_PRESETS = [
  'Jadwal hari ini apa?',
  'Buka menu presensi',
  'Seragam hari ini apa?',
  'Catat tugas baru',
  'Lihat insight bulanan',
  'Ruangan sekarang di mana?',
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  visible,
  currentClass,
  onClose,
  onExecuteAction,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [statusText, setStatusText] = useState('Katakan "Hai Idham" atau ucapkan perintah...');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Animation values for pulsing orb
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startPulseAnimation();
      handleStartListening();
    } else {
      VoiceService.stopSpeaking();
      setIsSpeaking(false);
      setIsListening(false);
    }
  }, [visible]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const handleStartListening = () => {
    setIsListening(true);
    setStatusText('🎙️ IDHAM AI sedang mendengarkan...');
    setTranscript('');
    setAiResponse('');

    // Web Speech Recognition Integration if on Web
    if (Platform.OS === 'web' && (window as any).webkitSpeechRecognition) {
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          processCommand(text);
        };

        recognition.onerror = () => {
          setIsListening(false);
          setStatusText('Ketik atau pilih perintah di bawah:');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (err) {
        console.log('Web speech error:', err);
      }
    }
  };

  const processCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    setStatusText('🧠 Memproses perintah suara...');
    setIsListening(false);

    try {
      const result = await VoiceService.processVoiceCommand(commandText, currentClass);
      setTranscript(commandText);
      setAiResponse(result.responseText);
      setStatusText('🔊 IDHAM AI Menjawab:');

      // Speak response aloud with Indonesian TTS
      setIsSpeaking(true);
      await VoiceService.speak(result.responseText);
      setIsSpeaking(false);

      if (onExecuteAction) {
        onExecuteAction(result);
      }
    } catch (e) {
      console.error(e);
      setStatusText('Maaf, saya tidak mengerti perintah tersebut.');
    }
  };

  const handleManualSubmit = () => {
    if (transcript.trim()) {
      processCommand(transcript.trim());
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.title}>IDHAM AI • Voice Command</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Pulsing AI Visualizer Orb */}
          <View style={styles.orbContainer}>
            <Animated.View
              style={[
                styles.outerGlow,
                {
                  transform: [{ scale: pulseAnim }, { rotate: spin }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.middleRing,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <TouchableOpacity
              style={[styles.coreOrb, isListening && styles.listeningCoreOrb]}
              onPress={handleStartListening}
              activeOpacity={0.8}
            >
              <Text style={styles.orbIcon}>{isListening ? '🎙️' : '✨'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.statusText}>{statusText}</Text>

          {/* Transcript / AI Response Bubble */}
          <View style={styles.dialogBox}>
            {transcript ? (
              <View style={styles.userBubble}>
                <Text style={styles.userLabel}>Anda Ucapkan:</Text>
                <Text style={styles.userText}>"{transcript}"</Text>
              </View>
            ) : null}

            {aiResponse ? (
              <ScrollView style={styles.aiBubbleScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.aiLabel}>Jawaban IDHAM AI:</Text>
                <Text style={styles.aiText}>{aiResponse}</Text>
              </ScrollView>
            ) : (
              <Text style={styles.hintText}>
                💡 Contoh ucapan: *"Hai Idham, jadwal hari ini apa?"* atau *"Buka absensi"*
              </Text>
            )}
          </View>

          {/* Quick Voice Chips */}
          <Text style={styles.presetLabel}>⚡ Perintah Suara Cepat:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
            {VOICE_PRESETS.map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.presetChip}
                onPress={() => {
                  setTranscript(preset);
                  processCommand(preset);
                }}
              >
                <Text style={styles.presetText}>🗣️ {preset}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Manual Input Fallback */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Atau ketik perintah di sini..."
              placeholderTextColor={COLORS.textLight}
              value={transcript}
              onChangeText={setTranscript}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !transcript.trim() && styles.sendBtnDisabled]}
              onPress={handleManualSubmit}
              disabled={!transcript.trim()}
            >
              <Text style={styles.sendText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F172A',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#334155',
    elevation: 10,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  title: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orbContainer: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  outerGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(217, 0, 0, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderStyle: 'dashed',
  },
  middleRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(225, 29, 72, 0.35)',
  },
  coreOrb: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FDA4AF',
  },
  listeningCoreOrb: {
    backgroundColor: '#059669',
    borderColor: '#6EE7B7',
  },
  orbIcon: {
    fontSize: 28,
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  dialogBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    minHeight: 100,
    maxHeight: 180,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userBubble: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
  },
  userLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  userText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 2,
  },
  aiBubbleScroll: {
    flex: 1,
  },
  aiLabel: {
    fontSize: 10,
    color: '#34D399',
    fontWeight: 'bold',
  },
  aiText: {
    fontSize: 12,
    color: '#F8FAFC',
    lineHeight: 18,
    marginTop: 2,
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 24,
  },
  presetLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
  },
  presetText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#475569',
  },
  sendText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
