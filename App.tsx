import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Animated,
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
import { getTimeBasedGreeting } from './src/components/Header';
import { VoiceCommandResult } from './src/services/voiceService';

type TabName = 'chat' | 'schedule' | 'attendance' | 'meeting' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('chat');
  const [currentClass, setCurrentClass] = useState('XII PPLG 3');
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  useEffect(() => {
    initApp();
    checkForUpdatesAutomatically();
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

  const checkForUpdatesAutomatically = async () => {
    if (__DEV__ || Platform.OS === 'web') return;

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          'Pembaruan Baru Tersedia! 🚀',
          'Aplikasi telah mengunduh pembaruan terbaru. Muat ulang sekarang untuk menerapkan?',
          [
            { text: 'Nanti', style: 'cancel' },
            {
              text: 'Muat Ulang',
              onPress: async () => {
                await Updates.reloadAsync();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.log('Error checking updates:', error);
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

      {/* Floating IDHAM AI Voice Command Trigger Button */}
      <TouchableOpacity
        style={styles.floatingVoiceBtn}
        onPress={() => setShowVoiceModal(true)}
        activeOpacity={0.85}
      >
        <View style={styles.floatingVoiceInner}>
          <Text style={styles.floatingVoiceIcon}>🎙️</Text>
          <Text style={styles.floatingVoiceLabel}>IDHAM AI</Text>
        </View>
      </TouchableOpacity>

      {/* Modern & Sleek Bottom Navigation Bar */}
      <SafeAreaView style={styles.bottomNavSafe}>
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'chat' && styles.activeNavItem]}
            onPress={() => setActiveTab('chat')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, activeTab === 'chat' && styles.activeIconWrapper]}>
              <Text style={styles.navIcon}>💬</Text>
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'chat' && styles.activeNavLabel,
              ]}
            >
              Bot Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'schedule' && styles.activeNavItem]}
            onPress={() => setActiveTab('schedule')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, activeTab === 'schedule' && styles.activeIconWrapper]}>
              <Text style={styles.navIcon}>📅</Text>
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'schedule' && styles.activeNavLabel,
              ]}
            >
              Jadwal
            </Text>
          </TouchableOpacity>

          {/* 📍 Tab Absensi Mandiri Digits Telkom */}
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'attendance' && styles.activeNavItem]}
            onPress={() => setActiveTab('attendance')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, activeTab === 'attendance' && styles.activeIconWrapper]}>
              <Text style={styles.navIcon}>📍</Text>
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'attendance' && styles.activeNavLabel,
              ]}
            >
              Absensi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'meeting' && styles.activeNavItem]}
            onPress={() => setActiveTab('meeting')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, activeTab === 'meeting' && styles.activeIconWrapper]}>
              <Text style={styles.navIcon}>📝</Text>
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'meeting' && styles.activeNavLabel,
              ]}
            >
              Tugas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'settings' && styles.activeNavItem]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, activeTab === 'settings' && styles.activeIconWrapper]}>
              <Text style={styles.navIcon}>⚙️</Text>
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'settings' && styles.activeNavLabel,
              ]}
            >
              Setelan
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
  floatingVoiceBtn: {
    position: 'absolute',
    bottom: 74,
    right: 16,
    zIndex: 99,
    elevation: 8,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  floatingVoiceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F43F5E',
    gap: 6,
  },
  floatingVoiceIcon: {
    fontSize: 15,
  },
  floatingVoiceLabel: {
    color: '#FDA4AF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bottomNavSafe: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 62,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingBottom: 2,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 14,
    marginHorizontal: 2,
  },
  activeNavItem: {
    backgroundColor: '#FEF2F2',
  },
  iconWrapper: {
    width: 36,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  activeIconWrapper: {
    backgroundColor: COLORS.primaryLight,
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  activeNavLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
