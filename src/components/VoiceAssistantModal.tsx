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
  const [statusText, setStatusText] = useState('🎙️ Sedang mendengarkan ucapan Anda...');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.3)).current;
  const waveAnim2 = useRef(new Animated.Value(0.6)).current;
  const waveAnim3 = useRef(new Animated.Value(0.9)).current;
  const waveAnim4 = useRef(new Animated.Value(0.4)).current;
  const waveAnim5 = useRef(new Animated.Value(0.7)).current;

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      startAnimations();
      // Auto-start listening immediately upon opening!
      setTimeout(() => {
        startListeningSession();
      }, 200);
    } else {
      stopListeningSession();
      VoiceService.stopSpeaking();
      setIsSpeaking(false);
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    }
  }, [visible]);

  const startAnimations = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Waveform animated bars
    const createWaveLoop = (anim: Animated.Value, maxVal: number, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxVal,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.2,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createWaveLoop(waveAnim1, 1.0, 350);
    createWaveLoop(waveAnim2, 1.2, 450);
    createWaveLoop(waveAnim3, 1.4, 300);
    createWaveLoop(waveAnim4, 1.1, 400);
    createWaveLoop(waveAnim5, 0.9, 500);
  };

  const startListeningSession = () => {
    setIsListening(true);
    setStatusText('🎙️ Mendengarkan... Silakan ucapkan perintah Anda:');
    setTranscript('');
    setAiResponse('');

    if (Platform.OS === 'web' && (window as any).webkitSpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          currentTranscript = currentTranscript.trim();
          setTranscript(currentTranscript);
          setStatusText('🗣️ Suara terdeteksi...');

          // Reset silence debounce timer
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (currentTranscript.trim()) {
              recognition.stop();
              processCommand(currentTranscript.trim());
            }
          }, 1200);
        };

        recognition.onerror = (err: any) => {
          console.log('Speech rec error:', err);
          setIsListening(false);
          setStatusText('Ketuk orb atau pilih perintah di bawah:');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.log('Web speech error:', err);
      }
    }
  };

  const stopListeningSession = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const processCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    stopListeningSession();
    setStatusText('🧠 IDHAM AI sedang memproses...');

    try {
      const result = await VoiceService.processVoiceCommand(commandText, currentClass);
      setTranscript(commandText);
      setAiResponse(result.responseText);
      setStatusText('🔊 IDHAM AI Menjawab:');

      // Speak response aloud with natural Indonesian TTS
      setIsSpeaking(true);
      await VoiceService.speak(result.responseText);
      setIsSpeaking(false);

      if (onExecuteAction) {
        onExecuteAction(result);
      }
    } catch (e) {
      console.error(e);
      setStatusText('Maaf, ada kendala saat memproses perintah suara.');
    }
  };

  const handleManualSubmit = () => {
    if (transcript.trim()) {
      processCommand(transcript.trim());
    }
  };

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

          {/* Interactive Pulsing AI Orb */}
          <View style={styles.orbContainer}>
            <Animated.View
              style={[
                styles.outerGlow,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <TouchableOpacity
              style={[styles.coreOrb, isListening && styles.listeningCoreOrb]}
              onPress={() => {
                if (isListening) {
                  stopListeningSession();
                } else {
                  startListeningSession();
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.orbIcon}>{isListening ? '🎙️' : '✨'}</Text>
            </TouchableOpacity>
          </View>

          {/* Real-Time Sound Waveform Visualizer Bars */}
          {isListening && (
            <View style={styles.waveformContainer}>
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim1 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim2 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim3 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim4 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim5 }] }]} />
            </View>
          )}

          <Text style={styles.statusText}>{statusText}</Text>

          {/* Live Transcript & AI Response Box */}
          <View style={styles.dialogBox}>
            {transcript ? (
              <View style={styles.userBubble}>
                <Text style={styles.userLabel}>Terdeteksi:</Text>
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
                💡 Suara Anda akan langsung terdeteksi otomatis begitu Anda berbicara.
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
              placeholder="Ketik perintah di sini..."
              placeholderTextColor="#64748B"
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
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
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
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  outerGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(225, 29, 72, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  coreOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    fontSize: 30,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 24,
    marginBottom: 6,
  },
  waveBar: {
    width: 4,
    height: 20,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  dialogBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    minHeight: 100,
    maxHeight: 170,
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
    marginBottom: 12,
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
