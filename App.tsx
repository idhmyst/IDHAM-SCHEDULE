import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { COLORS } from './src/constants/theme';
import { ChatScreen } from './src/screens/ChatScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { MeetingScreen } from './src/screens/MeetingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StorageService } from './src/services/storage';
import { NotificationService } from './src/services/notificationService';

type TabName = 'chat' | 'schedule' | 'meeting' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('chat');
  const [currentClass, setCurrentClass] = useState('XII PPLG 3');

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    const s = await StorageService.getSettings();
    if (s && s.defaultClass) {
      setCurrentClass(s.defaultClass);
    }
    // Schedule local notification reminders for schedules & meetings
    await NotificationService.scheduleAllReminders();
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

      {/* Bottom Navigation Bar */}
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
              Meeting
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
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconWrapper: {
    backgroundColor: COLORS.primaryLight,
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeNavLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
