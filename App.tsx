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
} from 'react-native';
import * as Updates from 'expo-updates';
import { COLORS } from './src/constants/theme';
import { ChatScreen } from './src/screens/ChatScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { AttendanceScreen } from './src/screens/AttendanceScreen';
import { MeetingScreen } from './src/screens/MeetingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StorageService } from './src/services/storage';
import { NotificationService } from './src/services/notificationService';

type TabName = 'chat' | 'schedule' | 'attendance' | 'meeting' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('chat');
  const [currentClass, setCurrentClass] = useState('XII PPLG 3');

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

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <ChatScreen
            currentClass={currentClass}
            onOpenSettings={() => setActiveTab('settings')}
          />
        );
      case 'schedule':
        return (
          <ScheduleScreen
            currentClass={currentClass}
            onOpenSettings={() => setActiveTab('settings')}
          />
        );
      case 'attendance':
        return (
          <AttendanceScreen
            currentClass={currentClass}
            onOpenSettings={() => setActiveTab('settings')}
          />
        );
      case 'meeting':
        return (
          <MeetingScreen
            currentClass={currentClass}
            onOpenSettings={() => setActiveTab('settings')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            currentClass={currentClass}
            onClassChange={cls => setCurrentClass(cls)}
          />
        );
      default:
        return <ChatScreen currentClass={currentClass} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.primaryDark} />
      <View style={styles.screenContainer}>{renderCurrentScreen()}</View>

      {/* Bottom Navigation Bar with 5 Prominent Tabs */}
      <SafeAreaView style={styles.bottomNavSafe}>
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
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
            style={styles.navItem}
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
            style={styles.navItem}
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
            style={styles.navItem}
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
            style={styles.navItem}
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
    borderTopColor: COLORS.border,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 38,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
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
    color: COLORS.textMuted,
    marginTop: 2,
  },
  activeNavLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
