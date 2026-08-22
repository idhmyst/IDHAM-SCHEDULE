import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  currentClass: string;
  onClassPress?: () => void;
  onAttendancePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'IDHAM SCHEDULE',
  subtitle = 'Offline Assistant',
  currentClass,
  onClassPress,
  onAttendancePress,
}) => {
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
            <Text style={styles.title}>{title}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>{subtitle}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightButtons}>
          {onAttendancePress && (
            <TouchableOpacity
              style={styles.absenBadge}
              onPress={onAttendancePress}
              activeOpacity={0.8}
            >
              <Text style={styles.absenText}>📍 Absen</Text>
            </TouchableOpacity>
          )}

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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
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
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  title: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
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
    opacity: 0.85,
    fontSize: 10,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  absenBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  classText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
});
