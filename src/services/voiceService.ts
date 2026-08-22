import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { generateBotResponse } from '../bot/responseFormatter';

export interface VoiceCommandResult {
  transcript: string;
  responseText: string;
  actionType?: string;
  openModal?: 'meeting' | 'task' | 'knowledge' | 'override' | 'attendance' | 'report' | 'auth';
  modalData?: any;
}

export const VoiceService = {
  // Check if text matches wake word
  isWakeWord(text: string): boolean {
    const clean = text.toLowerCase().trim();
    const wakePatterns = [
      /\b(hai|halo|helo|hey|hei|oke|ok)\s+idham\b/i,
      /\bidham\s+ai\b/i,
      /^idham\b/i,
    ];
    return wakePatterns.some(pattern => pattern.test(clean));
  },

  // Strip wake word to extract core command
  extractCommand(text: string): string {
    return text
      .replace(/\b(hai|halo|helo|hey|hei|oke|ok)\s+idham\b/gi, '')
      .replace(/\bidham\s+ai\b/gi, '')
      .replace(/^idham\b/gi, '')
      .trim();
  },

  // Speak Indonesian text aloud with expo-speech
  async speak(text: string): Promise<void> {
    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      // Clean markdown tags for clear Indonesian TTS
      const cleanText = text
        .replace(/[*_#`~]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/•/g, ', ')
        .trim();

      Speech.speak(cleanText, {
        language: 'id-ID',
        pitch: 1.05,
        rate: 0.95,
      });
    } catch (e) {
      console.log('Error in Speech.speak:', e);
    }
  },

  // Stop active speech
  async stopSpeaking(): Promise<void> {
    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    try {
      await Speech.stop();
    } catch (e) {}
  },

  // Process voice transcript with bot NLP
  async processVoiceCommand(transcript: string, currentClass: string): Promise<VoiceCommandResult> {
    const rawCommand = this.extractCommand(transcript) || transcript;
    const botRes = await generateBotResponse(rawCommand, currentClass);

    return {
      transcript,
      responseText: botRes.text,
      actionType: botRes.actionType,
      openModal: botRes.openModal,
      modalData: botRes.modalData,
    };
  },
};
