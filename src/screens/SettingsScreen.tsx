import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Updates from 'expo-updates';
import { COLORS } from '../constants/theme';
import { AVAILABLE_CLASSES } from '../data/masterSchedule';
import { ScheduleOverride, UserSettings } from '../types';
import { Header } from '../components/Header';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';

interface SettingsScreenProps {
  currentClass: string;
  onClassChange: (newClass: string) => void;
}

const NOTIFICATION_OPTIONS = [
  { label: 'Nonaktif', value: 0 },
  { label: '15 Menit', value: 15 },
  { label: '30 Menit', value: 30 },
  { label: '1 Jam', value: 60 },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentClass,
  onClassChange,
}) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await StorageService.getSettings();
    const o = await StorageService.getOverrides();
    setSettings(s);
    setOverrides(o);
  };

  const handleSelectClass = async (cls: string) => {
    if (settings) {
      const updated = { ...settings, defaultClass: cls };
      await StorageService.saveSettings(updated);
      setSettings(updated);
      onClassChange(cls);
      await NotificationService.scheduleAllReminders();
    }
  };

  const handleSelectNotificationOffset = async (minutes: number) => {
    if (settings) {
      const updated = { ...settings, notifyBeforeMinutes: minutes };
      await StorageService.saveSettings(updated);
      setSettings(updated);
      await NotificationService.scheduleAllReminders();
      Alert.alert(
        'Pengingat Diperbarui',
        minutes === 0
          ? 'Notifikasi pengingat dinonaktifkan.'
          : `Pengingat diatur ${minutes >= 60 ? '1 jam' : `${minutes} menit`} sebelum jadwal/meeting dimulai.`
      );
    }
  };

  const handleTestNotification = async () => {
    await NotificationService.sendInstantTestNotification();
  };

  const handleManualCheckUpdate = async () => {
    if (__DEV__ || Platform.OS === 'web') {
      Alert.alert('Info Update', 'Pengecekan live update berjalan di versi Standalone APK.');
      return;
    }

    setCheckingUpdate(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          'Pembaruan Ditemukan! 🚀',
          'Pembaruan terbaru berhasil diunduh. Tekan Muat Ulang untuk menerapkan seketika.',
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
      } else {
        Alert.alert('Aplikasi Terkini ✨', 'Aplikasi IDHAM SCHEDULE Anda sudah menggunakan versi paling baru!');
      }
    } catch (err: any) {
      Alert.alert('Info Update', 'Tidak dapat memeriksa update. Pastikan HP terhubung ke internet.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    await StorageService.deleteOverride(id);
    const o = await StorageService.getOverrides();
    setOverrides(o);
    await NotificationService.scheduleAllReminders();
  };

  const handleClearAllChats = () => {
    Alert.alert('Hapus Obrolan', 'Yakin ingin membersihkan seluruh percakapan bot?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus Semua',
        style: 'destructive',
        onPress: async () => {
          await StorageService.clearChats();
          Alert.alert('Sukses', 'Riwayat chat telah dibersihkan.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="PENGATURAN"
        subtitle="Konfigurasi Aplikasi"
        currentClass={currentClass}
      />

      <ScrollView style={styles.scrollArea}>
        {/* App Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
          <View style={styles.appInfo}>
            <Text style={styles.appName}>IDHAM SCHEDULE</Text>
            <Text style={styles.appDesc}>Asisten Jadwal & Agenda Offline</Text>
            <Text style={styles.appVersion}>Versi 1.0.0 (OTA Live Update Ready)</Text>
          </View>
        </View>

        {/* Section: Live Over-The-Air Update */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PEMBARUAN APLIKASI (LIVE UPDATE)</Text>
          <Text style={styles.sectionSubtitle}>
            Aplikasi otomatis memeriksa update saat dibuka. Anda juga dapat memeriksa secara manual:
          </Text>

          <TouchableOpacity
            style={styles.updateBtn}
            onPress={handleManualCheckUpdate}
            disabled={checkingUpdate}
            activeOpacity={0.7}
          >
            {checkingUpdate ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.updateBtnText}>🔄 Periksa Pembaruan Sekarang</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Section: Filter Pengingat / Notifikasi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PENGINGAT & NOTIFIKASI JADWAL</Text>
          <Text style={styles.sectionSubtitle}>
            Atur waktu notifikasi muncul sebelum jam mata pelajaran atau agenda meeting dimulai:
          </Text>

          <View style={styles.optionsRow}>
            {NOTIFICATION_OPTIONS.map(opt => {
              const isSelected = (settings?.notifyBeforeMinutes ?? 30) === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionChip, isSelected && styles.selectedOptionChip]}
                  onPress={() => handleSelectNotificationOffset(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.optionChipText, isSelected && styles.selectedOptionChipText]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.testNotifBtn} onPress={handleTestNotification}>
            <Text style={styles.testNotifText}>🔔 Tes Bunyikan Notifikasi Sekarang</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Pilih Kelas Aktif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PILIH KELAS UTAMA</Text>
          <Text style={styles.sectionSubtitle}>
            Jadwal default saat ini diatur untuk kelas XII PPLG 3 SMK Telkom Purwokerto.
          </Text>

          <View style={styles.classesGrid}>
            {AVAILABLE_CLASSES.map(cls => {
              const isSelected = currentClass === cls;
              return (
                <TouchableOpacity
                  key={cls}
                  style={[styles.classOption, isSelected && styles.selectedClassOption]}
                  onPress={() => handleSelectClass(cls)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.classOptionText, isSelected && styles.selectedClassOptionText]}
                  >
                    {cls}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Active Overrides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERUBAHAN JADWAL MANDIRI (OVERRIDES)</Text>
          {overrides.length > 0 ? (
            overrides.map(o => (
              <View key={o.id} style={styles.overrideItem}>
                <View style={styles.overrideInfo}>
                  <Text style={styles.overrideDay}>
                    📅 {o.day.toUpperCase()} • Jam ke-{o.period} ({o.className})
                  </Text>
                  <Text style={styles.overrideSubject}>
                    {o.newSubjectName || o.newSubjectCode || 'Mapel Tetap'} @ Ruang {o.newRoom || '-'}
                  </Text>
                  {o.note ? <Text style={styles.overrideNote}>Note: {o.note}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => handleDeleteOverride(o.id)}>
                  <Text style={styles.deleteText}>Hapus</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyNote}>
              Tidak ada jadwal yang sedang diubah (menggunakan jadwal baku master).
            </Text>
          )}
        </View>

        {/* Section: Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MANAJEMEN DATA & RIWAYAT</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearAllChats}>
            <Text style={styles.dangerButtonText}>🧹 Bersihkan Riwayat Chat Bot</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollArea: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  appDesc: {
    fontSize: 12,
    color: COLORS.textDark,
    marginTop: 2,
  },
  appVersion: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  optionChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  selectedOptionChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  selectedOptionChipText: {
    color: COLORS.white,
  },
  testNotifBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  testNotifText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  classesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedClassOption: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  classOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  selectedClassOptionText: {
    color: COLORS.white,
  },
  overrideItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  overrideInfo: {
    flex: 1,
  },
  overrideDay: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  overrideSubject: {
    fontSize: 13,
    color: COLORS.textDark,
    marginTop: 2,
  },
  overrideNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  deleteText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    padding: 6,
  },
  emptyNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  dangerButton: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
