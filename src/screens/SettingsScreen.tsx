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
import { AuthModal } from '../components/AuthModal';
import { ReportModal } from '../components/ReportModal';
import { CloudSyncService, UserProfile } from '../services/cloudSync';

interface SettingsScreenProps {
  currentClass: string;
  onClassChange: (newClass: string) => void;
  onOpenAttendance?: () => void;
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
  onOpenAttendance,
}) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([30]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [cloudUser, setCloudUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await StorageService.getSettings();
    const o = await StorageService.getOverrides();
    const cu = await CloudSyncService.getLocalProfile();

    setSettings(s);
    setOverrides(o);
    setCloudUser(cu);

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

  const toggleOffsetOption = async (val: number) => {
    let newOffsets: number[] = [];
    if (selectedOffsets.includes(val)) {
      newOffsets = selectedOffsets.filter(v => v !== val);
    } else {
      newOffsets = [...selectedOffsets, val].sort((a, b) => a - b);
    }

    setSelectedOffsets(newOffsets);
    if (settings) {
      const updated: UserSettings = {
        ...settings,
        notifyOffsets: newOffsets,
        notifyBeforeMinutes: newOffsets.length > 0 ? newOffsets[0] : 0,
      };
      await StorageService.saveSettings(updated);
      setSettings(updated);
      await NotificationService.scheduleAllReminders();
    }
  };

  const handleCheckUpdate = async () => {
    if (Platform.OS === 'web' || __DEV__) {
      Alert.alert('Live Update', 'Fitur Live Update aktif di aplikasi fisik yang ter-build.');
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
        onAttendancePress={onOpenAttendance}
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
            <Text style={styles.appVersion}>Versi 1.0.0 • SMK Telkom Purwokerto</Text>
          </View>
        </View>

        {/* ☁️ Cloud Supabase Integration Card */}
        <TouchableOpacity
          style={styles.cloudCard}
          onPress={() => setShowAuthModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.cloudIconBox}>
            <Text style={{ fontSize: 24 }}>☁️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cloudTitle}>Database Cloud & Akun Supabase</Text>
            <Text style={styles.cloudSub}>
              {cloudUser
                ? `Terhubung: ${cloudUser.fullName} (${cloudUser.email})`
                : 'Login / Backup data agar jadwal & tugas tidak hilang'}
            </Text>
          </View>
          <Text style={styles.cloudArrow}>➔</Text>
        </TouchableOpacity>

        {/* 📊 Insight & Download PDF Card */}
        <TouchableOpacity
          style={styles.reportCard}
          onPress={() => setShowReportModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.reportIconBox}>
            <Text style={{ fontSize: 24 }}>📊</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportTitle}>Insight & Evaluasi Belajar</Text>
            <Text style={styles.reportSub}>
              Statistik Izin, Sakit, Alpa per bulan & Download Laporan PDF
            </Text>
          </View>
          <Text style={styles.reportArrow}>📄 PDF</Text>
        </TouchableOpacity>

        {/* Notifikasi & Pengingat Multi-Select Drawer Trigger */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 PENGINGAT & NADA DERING</Text>
          <View style={styles.card}>
            <View style={styles.filterBarHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>Waktu Pengingat Alarm</Text>
                <Text style={styles.cardSub}>
                  {selectedOffsets.length > 0
                    ? `Aktif (${selectedOffsets.length}): ${selectedOffsets.map(m => getReminderLabel(m)).join(', ')}`
                    : 'Tidak ada pengingat aktif (Mati)'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.hamburgerBtn}
                onPress={() => setShowFilterDrawer(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.hamburgerIcon}>☰</Text>
                <Text style={styles.hamburgerText}>Filter Bar ({selectedOffsets.length})</Text>
              </TouchableOpacity>
            </View>

            {/* Direct Quick Filtering Strip */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
              {NOTIFICATION_FILTER_OPTIONS.map(opt => {
                const isSelected = selectedOffsets.includes(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.quickOffsetChip,
                      isSelected && styles.activeQuickOffsetChip,
                    ]}
                    onPress={() => toggleOffsetOption(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickOffsetBadge, isSelected && styles.activeQuickOffsetBadge]}>
                      {isSelected ? '✓ ' : ''}{opt.badge}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.testNotifBtn}
              onPress={() => NotificationService.sendInstantTestNotification()}
              activeOpacity={0.8}
            >
              <Text style={styles.testNotifText}>🔔 Tes Ringtone & Getar Notifikasi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pilihan Kelas Default */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏫 KELAS DEFAULT</Text>
          <View style={styles.card}>
            <View style={styles.classGrid}>
              {AVAILABLE_CLASSES.map(cls => (
                <TouchableOpacity
                  key={cls}
                  style={[
                    styles.classChip,
                    currentClass === cls && styles.activeClassChip,
                  ]}
                  onPress={() => handleSelectClass(cls)}
                >
                  <Text
                    style={[
                      styles.classChipText,
                      currentClass === cls && styles.activeClassChipText,
                    ]}
                  >
                    {cls}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Perubahan Jadwal Aktif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ✏️ PERUBAHAN JADWAL SEMENTARA ({overrides.length})
          </Text>
          <View style={styles.card}>
            {overrides.length > 0 ? (
              overrides.map(override => (
                <View key={override.id} style={styles.overrideItem}>
                  <View style={styles.overrideInfo}>
                    <Text style={styles.overrideTitle}>
                      {override.day.toUpperCase()} • Jam ke-{override.period}
                    </Text>
                    <Text style={styles.overrideDetail}>
                      {override.newSubjectName || override.newSubjectCode}
                    </Text>
                    {override.newRoom ? (
                      <Text style={styles.overrideRoom}>Ruang: {override.newRoom}</Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteOverride(override.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Tidak ada perubahan jadwal aktif.</Text>
            )}
          </View>
        </View>

        {/* Live OTA Update Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 PEMBARUAN LIVE APLIKASI (OTA)</Text>
          <View style={styles.card}>
            <Text style={styles.updateDesc}>
              Aplikasi mendukung pembaruan kode otomatis langsung tanpa perlu download ulang file APK.
            </Text>
            <TouchableOpacity
              style={styles.updateBtn}
              onPress={handleCheckUpdate}
              disabled={checkingUpdate}
              activeOpacity={0.8}
            >
              {checkingUpdate ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.updateBtnText}>⚡ Periksa Pembaruan Sekarang</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Clear Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧹 RIWAYAT & PENYIMPANAN</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.clearChatBtn}
              onPress={handleClearAllChats}
            >
              <Text style={styles.clearChatText}>Hapus Riwayat Percakapan Bot</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Hamburger Drawer Filter Bar Modal */}
      <Modal visible={showFilterDrawer} animationType="slide" transparent>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>☰</Text>
                <Text style={styles.drawerTitle}>Pilih Waktu Pengingat Alarm</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilterDrawer(false)}>
                <Text style={styles.closeDrawerText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.drawerSub}>
              Pilih waktu alarm (bisa centang lebih dari 1):
            </Text>

            <ScrollView style={styles.drawerList}>
              {NOTIFICATION_FILTER_OPTIONS.map(opt => {
                const isSelected = selectedOffsets.includes(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.drawerItem, isSelected && styles.activeDrawerItem]}
                    onPress={() => toggleOffsetOption(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.drawerItemIcon}>{opt.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.drawerItemLabel,
                          isSelected && styles.activeDrawerItemLabel,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={styles.drawerItemDesc}>
                        {opt.value < 60
                          ? `Alarm berdering ${opt.value} menit sebelumnya`
                          : opt.value < 1440
                          ? `Alarm berdering 1 jam sebelumnya`
                          : `Alarm berdering ${Math.round(opt.value / 1440)} hari sebelumnya`}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.checkboxBox,
                        isSelected && styles.activeCheckboxBox,
                      ]}
                    >
                      {isSelected && <Text style={styles.checkText}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShowFilterDrawer(false)}
            >
              <Text style={styles.doneBtnText}>Selesai & Simpan ({selectedOffsets.length} Waktu)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cloud Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          loadData();
        }}
      />

      {/* Report & PDF Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
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
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    elevation: 2,
    gap: 12,
  },
  appIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  appDesc: {
    fontSize: 12,
    color: COLORS.textDark,
    marginTop: 2,
  },
  appVersion: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cloudCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  cloudIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  cloudSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  cloudArrow: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  reportIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  reportSub: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 2,
  },
  reportArrow: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  filterBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  hamburgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    gap: 6,
  },
  hamburgerIcon: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  hamburgerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  quickOffsetChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  activeQuickOffsetChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickOffsetBadge: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  activeQuickOffsetBadge: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  testNotifBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  testNotifText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeClassChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  classChipText: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  activeClassChipText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  overrideItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  overrideInfo: {
    flex: 1,
  },
  overrideTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  overrideDetail: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  overrideRoom: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  updateDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  updateBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  clearChatBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearChatText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  drawerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  closeDrawerText: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  drawerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  drawerList: {
    marginBottom: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginBottom: 8,
    gap: 10,
  },
  activeDrawerItem: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  drawerItemIcon: {
    fontSize: 20,
  },
  drawerItemLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  activeDrawerItemLabel: {
    color: COLORS.primary,
  },
  drawerItemDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheckboxBox: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
