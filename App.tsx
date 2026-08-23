import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as Updates from 'expo-updates';
import { COLORS } from './src/constants/theme';
import { ChatScreen } from './src/screens/ChatScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { AttendanceScreen } from './src/screens/AttendanceScreen';
import { MeetingScreen } from './src/screens/MeetingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { VoiceAssistantModal } from './src/components/VoiceAssistantModal';
import { StorageService } from './src/services/storage';
import { NotificationService } from './src/services/notificationService';
import { CloudSyncService } from './src/services/cloudSync';
import { VoiceCommandResult, VoiceService } from './src/services/voiceService';

type TabName = 'chat' | 'schedule' | 'attendance' | 'meeting' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('chat');
  const [currentClass, setCurrentClass] = useState('XII PPLG 3');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const wakeWordRecognitionRef = useRef<any>(null);

  useEffect(() => {
    initApp();
    checkForUpdatesAutomatically();
    startBackgroundWakeWordListener();

    return () => {
      stopBackgroundWakeWordListener();
    };
  }, []);

  const initApp = async () => {
    const s = await StorageService.getSettings();
    if (s && s.defaultClass) {
      setCurrentClass(s.defaultClass);
    }
    await NotificationService.scheduleAllReminders();

    // Auto-sync Supabase if user already logged in
    const user = await CloudSyncService.getCurrentUser();
    if (user) {
      await CloudSyncService.syncFromCloud(user.id);
    }
  };

  // Instant Automatic OTA Update without waiting
  const checkForUpdatesAutomatically = async () => {
    if (__DEV__ || Platform.OS === 'web') return;

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.log('Auto update check error:', error);
    }
  };

  // Passive In-App Wake-Word Detection ("Hai Idham" / "Halo Idham")
  const startBackgroundWakeWordListener = () => {
    if (Platform.OS === 'web' && (window as any).webkitSpeechRecognition) {
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (VoiceService.isWakeWord(text)) {
              setShowVoiceModal(true);
              break;
            }
          }
        };

        recognition.onerror = () => {};

        recognition.onend = () => {
          try {
            if (!showVoiceModal) recognition.start();
          } catch (e) {}
        };

        recognition.start();
        wakeWordRecognitionRef.current = recognition;
      } catch (err) {}
    }
  };

  const stopBackgroundWakeWordListener = () => {
    if (wakeWordRecognitionRef.current) {
      try { wakeWordRecognitionRef.current.stop(); } catch (e) {}
      wakeWordRecognitionRef.current = null;
    }
  };

  const handleVoiceAction = (result: VoiceCommandResult) => {
    if (result.openModal === 'attendance') {
      setActiveTab('attendance');
    } else if (result.openModal === 'meeting' || result.openModal === 'task') {
      setActiveTab('meeting');
    } else if (result.actionType === 'schedule') {
      setActiveTab('schedule');
    }
  };

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <ChatScreen
            currentClass={currentClass}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenAttendance={() => setActiveTab('attendance')}
            onVoiceAIPress={() => setShowVoiceModal(true)}
          />
        );
      case 'schedule':
        return (
          <ScheduleScreen
            currentClass={currentClass}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenAttendance={() => setActiveTab('attendance')}
            onVoiceAIPress={() => setShowVoiceModal(true)}
          />
        );
      case 'attendance':
        return (
          <AttendanceScreen
            currentClass={currentClass}
            onOpenSettings={() => setActiveTab('settings')}
            onVoiceAIPress={() => setShowVoiceModal(true)}
          />
        );
      case 'meeting':
        return (
          <MeetingScreen
            currentClass={currentClass}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenAttendance={() => setActiveTab('attendance')}
            onVoiceAIPress={() => setShowVoiceModal(true)}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            currentClass={currentClass}
            onClassChange={cls => setCurrentClass(cls)}
            onOpenAttendance={() => setActiveTab('attendance')}
            onVoiceAIPress={() => setShowVoiceModal(true)}
          />
        );
      default:
        return (
          <ChatScreen
            currentClass={currentClass}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenAttendance={() => setActiveTab('attendance')}
            onVoiceAIPress={() => setShowVoiceModal(true)}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.primaryDark} />
      <View style={styles.screenContainer}>{renderCurrentScreen()}</View>

      {/* Ultra-Clean Bottom Navigation Bar with Center Elevated IDHAM AI Orb */}
      <SafeAreaView style={styles.bottomNavSafe}>
        <View style={styles.bottomNav}>
          {/* Tab 1: Bot Chat */}
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'chat' && styles.activeNavItem]}
            onPress={() => setActiveTab('chat')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, activeTab === 'chat' && styles.activeIconWrapper]}>
              <Text style={styles.navIcon}>💬</Text>
            </View>
            <Text style={[styles.navLabel, activeTab === 'chat' && styles.activeNavLabel]}>
              Chat
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Jadwal */}
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'schedule' && styles.activeNavItem]}
            onPress={() => setActiveTab('schedule')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, activeTab === 'schedule' && styles.activeIconWrapper]}>
              <Text style={styles.navIcon}>📅</Text>
            </View>
            <Text style={[styles.navLabel, activeTab === 'schedule' && styles.activeNavLabel]}>
              Jadwal
            </Text>
          </TouchableOpacity>

          {/* Center Elevated IDHAM AI Action Button */}
          <TouchableOpacity
            style={styles.centerAiContainer}
            onPress={() => setShowVoiceModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.centerAiOrb}>
              <Text style={styles.centerAiIcon}>🎙️</Text>
            </View>
            <Text style={styles.centerAiLabel}>IDHAM AI</Text>
          </TouchableOpacity>

          {/* Tab 3: Absensi Mandiri Digits Telkom */}
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'attendance' && styles.activeNavItem]}
            onPress={() => setActiveTab('attendance')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, activeTab === 'attendance' && styles.activeIconWrapper]}>
              <Text style={styles.navIcon}>📍</Text>
            </View>
            <Text style={[styles.navLabel, activeTab === 'attendance' && styles.activeNavLabel]}>
              Absensi
            </Text>
          </TouchableOpacity>

          {/* Tab 4: Tugas */}
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'meeting' && styles.activeNavItem]}
            onPress={() => setActiveTab('meeting')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, activeTab === 'meeting' && styles.activeIconWrapper]}>
              <Text style={styles.navIcon}>📝</Text>
            </View>
            <Text style={[styles.navLabel, activeTab === 'meeting' && styles.activeNavLabel]}>
              Tugas
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* IDHAM AI Voice Command Modal */}
      <VoiceAssistantModal
        visible={showVoiceModal}
        currentClass={currentClass}
        onClose={() => setShowVoiceModal(false)}
        onExecuteAction={handleVoiceAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNavSafe: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 1,
  },
  activeNavItem: {
    backgroundColor: '#FEF2F2',
  },
  iconWrapper: {
    width: 32,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeIconWrapper: {
    backgroundColor: COLORS.primaryLight,
  },
  navIcon: {
    fontSize: 17,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  activeNavLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  centerAiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
    marginHorizontal: 4,
  },
  centerAiOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  centerAiIcon: {
    fontSize: 20,
  },
  centerAiLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#E11D48',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
