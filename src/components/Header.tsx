import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { CloudSyncService } from '../services/cloudSync';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  currentClass: string;
  onClassPress?: () => void;
  onAttendancePress?: () => void;
  onVoiceAIPress?: () => void;
}

export const getTimeBasedGreeting = (userName: string = 'Idham'): { greeting: string; icon: string } => {
  const currentHour = new Date().getHours();

  if (currentHour >= 4 && currentHour < 11) {
    return { greeting: `Pagi, ${userName}!`, icon: '🌅' };
  } else if (currentHour >= 11 && currentHour < 15) {
    return { greeting: `Siang, ${userName}!`, icon: '☀️' };
  } else if (currentHour >= 15 && currentHour < 18.5) {
    return { greeting: `Sore, ${userName}!`, icon: '🌇' };
  } else {
    return { greeting: `Malam, ${userName}!`, icon: '🌙' };
  }
};

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle = 'Offline AI Assistant',
  currentClass,
  onClassPress,
  onAttendancePress,
  onVoiceAIPress,
}) => {
  const [greetingText, setGreetingText] = useState('Halo, Idham!');
  const [greetingIcon, setGreetingIcon] = useState('👋');

  useEffect(() => {
    updateGreeting();
  }, []);

  const updateGreeting = async () => {
    const user = await CloudSyncService.getCurrentUser();
    const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Idham';
    const { greeting, icon } = getTimeBasedGreeting(firstName);
    setGreetingText(greeting);
    setGreetingIcon(icon);
  };

  const headerTitle = title || `${greetingText} ${greetingIcon}`;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.title}>{headerTitle}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>{subtitle}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightButtons}>
          {/* IDHAM AI Voice Command Button */}
          {onVoiceAIPress && (
            <TouchableOpacity
              style={styles.voiceBtn}
              onPress={onVoiceAIPress}
              activeOpacity={0.8}
            >
              <Text style={styles.voiceIcon}>🎙️</Text>
            </TouchableOpacity>
          )}

          {/* Quick Attendance Pill */}
          {onAttendancePress && (
            <TouchableOpacity
              style={styles.absenBadge}
              onPress={onAttendancePress}
              activeOpacity={0.8}
            >
              <Text style={styles.absenText}>📍 Absen</Text>
            </TouchableOpacity>
          )}

          {/* Class Pill */}
          <TouchableOpacity style={styles.classBadge} onPress={onClassPress} activeOpacity={0.8}>
            <Text style={styles.classText}>{currentClass}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingTop: 46,
    paddingBottom: 14,
    paddingHorizontal: 14,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  title: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  statusText: {
    color: COLORS.white,
    opacity: 0.9,
    fontSize: 10,
    fontWeight: '500',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  voiceBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  voiceIcon: {
    fontSize: 14,
  },
  absenBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34D399',
  },
  absenText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  classBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  classText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
});
