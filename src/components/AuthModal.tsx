import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { CloudSyncService, UserProfile } from '../services/cloudSync';
import { ReportService } from '../services/reportService';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('XII PPLG 3');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadProfile();
    }
  }, [visible]);

  const loadProfile = async () => {
    const p = await CloudSyncService.getLocalProfile();
    const ls = await CloudSyncService.getLastSyncTime();
    setProfile(p);
    setLastSync(ls);
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Data Belum Lengkap', 'Masukkan Email dan Password.');
      return;
    }

    setLoading(true);
    if (mode === 'register') {
      if (!fullName.trim()) {
        Alert.alert('Nama Diperlukan', 'Masukkan Nama Lengkap Anda.');
        setLoading(false);
        return;
      }
      const res = await CloudSyncService.signUp(email, password, fullName, className);
      setLoading(false);
      if (res.success && res.user) {
        setProfile(res.user);
        Alert.alert('Akun Berhasil Dibuat! ☁️', `Selamat datang, ${res.user.fullName}! Data Anda otomatis disinkronkan ke Supabase.`);
      } else {
        Alert.alert('Gagal Daftar', res.message || 'Periksa kembali data Anda.');
      }
    } else {
      const res = await CloudSyncService.signIn(email, password);
      setLoading(false);
      if (res.success && res.user) {
        setProfile(res.user);
        Alert.alert('Login Berhasil! 🎓', `Selamat datang kembali, ${res.user.fullName}! Data Anda telah dipulihkan dari Supabase.`);
      } else {
        Alert.alert('Gagal Masuk', res.message || 'Periksa kembali email dan password Anda.');
      }
    }
  };

  const handleSyncUp = async () => {
    if (!profile) return;
    setSyncing(true);
    const res = await CloudSyncService.syncToCloud(profile.id);
    setSyncing(false);
    const ls = await CloudSyncService.getLastSyncTime();
    setLastSync(ls);
    Alert.alert('Sinkronisasi Cloud', res.message);
  };

  const handleSyncDown = async () => {
    if (!profile) return;
    setSyncing(true);
    const res = await CloudSyncService.syncFromCloud(profile.id);
    setSyncing(false);
    const ls = await CloudSyncService.getLastSyncTime();
    setLastSync(ls);
    Alert.alert('Pemulihan Data Cloud', res.message);
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    await ReportService.exportAndShareExcel();
    setExportingExcel(false);
  };

  const handleLogout = async () => {
    Alert.alert('Keluar Akun', 'Yakin ingin keluar dari akun Cloud Supabase ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await CloudSyncService.signOut();
          setProfile(null);
          setEmail('');
          setPassword('');
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>☁️</Text>
              <View>
                <Text style={styles.headerTitle}>Akun Cloud & Database Supabase</Text>
                <Text style={styles.headerSub}>
                  {profile ? `Terhubung: ${profile.fullName}` : 'Simpan Data Agar Tidak Hilang'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {profile ? (
              <View style={styles.profileSection}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>🎓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{profile.fullName}</Text>
                    <Text style={styles.profileEmail}>{profile.email}</Text>
                    <Text style={styles.profileClass}>Kelas: {profile.className}</Text>
                  </View>
                  <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Keluar</Text>
                  </TouchableOpacity>
                </View>

                {/* Cloud Sync Status */}
                <View style={styles.syncStatusBox}>
                  <Text style={styles.syncStatusTitle}>🟢 Status Database: Terhubung</Text>
                  <Text style={styles.syncStatusSub}>
                    Semua jadwal, meeting, tugas, presensi, dan berkas AI tersimpan aman di database cloud Supabase.
                  </Text>
                  {lastSync && (
                    <Text style={styles.lastSyncText}>
                      Terakhir Sinkron: <strong>{lastSync}</strong>
                    </Text>
                  )}
                </View>

                {/* Sync & Export Action Buttons */}
                <View style={styles.syncActions}>
                  <TouchableOpacity
                    style={styles.syncBtn}
                    onPress={handleSyncUp}
                    disabled={syncing}
                    activeOpacity={0.8}
                  >
                    {syncing ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Text style={styles.syncBtnIcon}>⬆️</Text>
                        <Text style={styles.syncBtnText}>Backup ke Cloud Sekarang</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.restoreBtn}
                    onPress={handleSyncDown}
                    disabled={syncing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.restoreBtnIcon}>📥</Text>
                    <Text style={styles.restoreBtnText}>Pulihkan Data Dari Cloud</Text>
                  </TouchableOpacity>

                  {/* Excel Download Button */}
                  <TouchableOpacity
                    style={styles.excelBtn}
                    onPress={handleExportExcel}
                    disabled={exportingExcel}
                    activeOpacity={0.8}
                  >
                    {exportingExcel ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Text style={styles.excelBtnIcon}>📗</Text>
                        <Text style={styles.excelBtnText}>
                          Unduh Rekap Seluruh Inputan (.Excel / .CSV)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.authForm}>
                {/* Mode Switcher */}
                <View style={styles.authModeSwitch}>
                  <TouchableOpacity
                    style={[styles.authModeBtn, mode === 'login' && styles.activeAuthModeBtn]}
                    onPress={() => setMode('login')}
                  >
                    <Text
                      style={[
                        styles.authModeText,
                        mode === 'login' && styles.activeAuthModeText,
                      ]}
                    >
                      Masuk (Login)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.authModeBtn, mode === 'register' && styles.activeAuthModeBtn]}
                    onPress={() => setMode('register')}
                  >
                    <Text
                      style={[
                        styles.authModeText,
                        mode === 'register' && styles.activeAuthModeText,
                      ]}
                    >
                      Daftar Akun Baru
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.formDesc}>
                  {mode === 'login'
                    ? 'Masuk untuk memulihkan jadwal, tugas, dan presensi Anda dari Supabase.'
                    : 'Buat akun untuk menyimpan seluruh jadwal, presensi, dan berkas materi Anda di cloud.'}
                </Text>

                {mode === 'register' && (
                  <>
                    <Text style={styles.label}>Nama Lengkap *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="cth: Idham Baihaqi"
                      placeholderTextColor={COLORS.textLight}
                      value={fullName}
                      onChangeText={setFullName}
                    />

                    <Text style={styles.label}>Kelas</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="XII PPLG 3"
                      placeholderTextColor={COLORS.textLight}
                      value={className}
                      onChangeText={setClassName}
                    />
                  </>
                )}

                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="contoh@gmail.com"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={styles.label}>Kata Sandi *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  style={styles.submitAuthBtn}
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.submitAuthText}>
                      {mode === 'login' ? 'Masuk & Sinkronkan Data' : 'Daftar & Hubungkan ke Cloud'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  closeText: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 10,
  },
  profileSection: {
    gap: 10,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  profileName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  profileClass: {
    fontSize: 10,
    color: COLORS.textDark,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoutText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  syncStatusBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  syncStatusTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065F46',
  },
  syncStatusSub: {
    fontSize: 10,
    color: '#047857',
    lineHeight: 15,
  },
  lastSyncText: {
    fontSize: 10,
    color: '#065F46',
    marginTop: 4,
  },
  syncActions: {
    gap: 8,
    marginTop: 4,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  syncBtnIcon: {
    fontSize: 16,
  },
  syncBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  restoreBtnIcon: {
    fontSize: 16,
  },
  restoreBtnText: {
    color: COLORS.textDark,
    fontWeight: 'bold',
    fontSize: 12,
  },
  excelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  excelBtnIcon: {
    fontSize: 16,
  },
  excelBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  authForm: {
    gap: 8,
  },
  authModeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  authModeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeAuthModeBtn: {
    backgroundColor: COLORS.white,
    elevation: 1,
  },
  authModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeAuthModeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  formDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textDark,
  },
  submitAuthBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  submitAuthText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    paddingTop: 6,
  },
  closeBtn: {
    backgroundColor: COLORS.background,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtnText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
});
