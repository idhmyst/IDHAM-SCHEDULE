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
  Modal,
} from 'react-native';
import * as Updates from 'expo-updates';
import { COLORS } from '../constants/theme';
import { AVAILABLE_CLASSES } from '../data/masterSchedule';
import { ScheduleOverride, UserSettings } from '../types';
import { Header } from '../components/Header';
import { StorageService } from '../services/storage';
import { NotificationService, getReminderLabel } from '../services/notificationService';

interface SettingsScreenProps {
  currentClass: string;
  onClassChange: (newClass: string) => void;
}

const NOTIFICATION_FILTER_OPTIONS = [
  { label: '5 Menit Sebelum', value: 5, icon: '⏱️', badge: '5 Min' },
  { label: '10 Menit Sebelum', value: 10, icon: '⏱️', badge: '10 Min' },
  { label: '15 Menit Sebelum', value: 15, icon: '🔔', badge: '15 Min' },
  { label: '30 Menit Sebelum', value: 30, icon: '🔔', badge: '30 Min' },
  { label: '1 Jam Sebelum', value: 60, icon: '⏰', badge: '1 Jam' },
  { label: '1 Hari Sebelum (H-1)', value: 1440, icon: '📅', badge: 'H-1' },
  { label: '1 Minggu Sebelum (H-7)', value: 10080, icon: '🗓️', badge: 'H-7' },
  { label: '1 Bulan Sebelum (H-30)', value: 43200, icon: '📆', badge: 'H-30' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentClass,
  onClassChange,
}) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([30]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await StorageService.getSettings();
    const o = await StorageService.getOverrides();
    setSettings(s);
    setOverrides(o);

    if (s.notifyOffsets && s.notifyOffsets.length > 0) {
      setSelectedOffsets(s.notifyOffsets);
    } else if (s.notifyBeforeMinutes > 0) {
      setSelectedOffsets([s.notifyBeforeMinutes]);
    } else {
      setSelectedOffsets([]);
    }
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

  // Toggle multi-select reminder
  const handleToggleOffset = (val: number) => {
    let updated: number[];
    if (selectedOffsets.includes(val)) {
      updated = selectedOffsets.filter(x => x !== val);
    } else {
      updated = [...selectedOffsets, val].sort((a, b) => a - b);
    }
    setSelectedOffsets(updated);
  };

  const handleSaveMultiOffsets = async () => {
    if (settings) {
      const updated = {
        ...settings,
        notifyOffsets: selectedOffsets,
        notifyBeforeMinutes: selectedOffsets[0] || 0,
      };
      await StorageService.saveSettings(updated);
      setSettings(updated);
      await NotificationService.scheduleAllReminders();
      setShowFilterDrawer(false);

      if (selectedOffsets.length === 0) {
        Alert.alert('Pengingat Dinonaktifkan', 'Semua notifikasi pengingat telah dimatikan.');
      } else {
        const labels = selectedOffsets.map(o => getReminderLabel(o)).join(', ');
        Alert.alert(
          'Multi-Pengingat Disimpan! 🔔',
          `Alarm pengingat akan berbunyi di beberapa waktu:\n• ${labels}`
        );
      }
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
            <Text style={styles.appVersion}>Versi 1.0.0 (Multi-Pengingat & Sound Ready)</Text>
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

        {/* Section: Multi-Select Hamburger Filtering Bar Pengingat */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PENGINGAT & FILTER NOTIFIKASI (MULTI-INPUT)</Text>
          <Text style={styles.sectionSubtitle}>
            Anda dapat memilih lebih dari 1 waktu pengingat sekaligus (misal: 15 menit & 1 jam & 1 hari sebelum):
          </Text>

          {/* Filtering Bar Menu */}
          <TouchableOpacity
            style={styles.filteringBar}
            onPress={() => setShowFilterDrawer(true)}
            activeOpacity={0.8}
          >
            <View style={styles.hamburgerIconContainer}>
              <Text style={styles.hamburgerIcon}>☰</Text>
            </View>
            <View style={styles.filterBarInfo}>
              <Text style={styles.filterBarLabel}>
                Pengingat Aktif ({selectedOffsets.length} Waktu)
              </Text>
              <Text style={styles.filterBarValue} numberOfLines={2}>
                {selectedOffsets.length > 0
                  ? selectedOffsets.map(o => getReminderLabel(o)).join(' • ')
                  : '🔕 Pengingat Nonaktif'}
              </Text>
            </View>
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>Ubah (☰)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testNotifBtn} onPress={handleTestNotification}>
            <Text style={styles.testNotifText}>🔔 Tes Ringtone & Getar Notifikasi</Text>
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

      {/* Hamburger Multi-Select Filtering Drawer Modal */}
      <Modal visible={showFilterDrawer} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalDrawer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalIcon}>☰</Text>
                <Text style={styles.modalTitle}>Pilih Pengingat (Bisa Lebih dari 1)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilterDrawer(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.drawerHint}>
              Centang semua waktu yang Anda inginkan agar HP berbunyi & bergetar di setiap waktu tersebut:
            </Text>

            <ScrollView style={styles.drawerList} showsVerticalScrollIndicator={false}>
              {NOTIFICATION_FILTER_OPTIONS.map(option => {
                const isSelected = selectedOffsets.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.drawerItem, isSelected && styles.selectedDrawerItem]}
                    onPress={() => handleToggleOffset(option.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.drawerItemLeft}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.drawerItemIcon}>{option.icon}</Text>
                      <Text
                        style={[
                          styles.drawerItemLabel,
                          isSelected && styles.selectedDrawerItemLabel,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.drawerBadge,
                        isSelected && styles.selectedDrawerBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.drawerBadgeText,
                          isSelected && styles.selectedDrawerBadgeText,
                        ]}
                      >
                        {option.badge}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.saveMultiBtn} onPress={handleSaveMultiOffsets}>
              <Text style={styles.saveMultiBtnText}>
                ✓ Terapkan ({selectedOffsets.length} Waktu Pengingat)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  filteringBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBadge,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  hamburgerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerIcon: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterBarInfo: {
    flex: 1,
  },
  filterBarLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  filterBarValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 2,
  },
  filterBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  filterBadgeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDrawer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalIcon: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  modalCloseText: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    padding: 4,
  },
  drawerHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  drawerList: {
    marginVertical: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: COLORS.background,
  },
  selectedDrawerItem: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  drawerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  drawerItemIcon: {
    fontSize: 16,
  },
  drawerItemLabel: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  selectedDrawerItemLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  drawerBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedDrawerBadge: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  drawerBadgeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  selectedDrawerBadgeText: {
    color: COLORS.white,
  },
  saveMultiBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveMultiBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
