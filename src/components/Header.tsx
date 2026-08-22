import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
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
        {/* Left: Brand / Logo + Dynamic Greeting & Status */}
        <View style={styles.brandContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.titleWrapper}>
            <Text style={styles.title} numberOfLines={1}>
              {headerTitle}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: Actions (IDHAM AI, Absen, & Class Badge) */}
        <View style={styles.rightButtons}>
          {onVoiceAIPress && (
            <TouchableOpacity
              style={styles.voiceBtn}
              onPress={onVoiceAIPress}
              activeOpacity={0.8}
            >
              <Text style={styles.voiceIcon}>🎙️</Text>
            </TouchableOpacity>
          )}

          {onAttendancePress && (
            <TouchableOpacity
              style={styles.absenBadge}
              onPress={onAttendancePress}
              activeOpacity={0.8}
            >
              <Text style={styles.absenText}>📍 Absen</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.classBadge}
            onPress={onClassPress}
            activeOpacity={0.8}
          >
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
    paddingTop: Platform.OS === 'android' ? 40 : 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
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
    marginRight: 8,
  },
  logoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 10.5,
    fontWeight: '500',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    fontSize: 13,
  },
  absenBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#34D399',
    elevation: 2,
  },
  absenText: {
    color: COLORS.white,
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  classBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  classText: {
    color: COLORS.white,
    fontSize: 10.5,
    fontWeight: '700',
  },
});
