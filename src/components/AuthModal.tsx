import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { CloudSyncService, UserProfile } from '../services/cloudSync';
import { ReportService } from '../services/reportService';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send');

  // Form states
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('Idham Baihaqi');
  const [className, setClassName] = useState('XII PPLG 3');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (visible) {
      loadProfileAndStatus();
    }
  }, [visible]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const loadProfileAndStatus = async () => {
    const user = await CloudSyncService.getCurrentUser();
    setCurrentUser(user);
    const syncTime = await CloudSyncService.getLastSyncTime();
    if (syncTime) {
      const d = new Date(syncTime);
      setLastSyncTime(
        `${d.toLocaleDateString('id-ID')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} WIB`
      );
    }
  };

  // 1. Kirim Kode OTP Asli ke Email
  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Email Tidak Valid', 'Masukkan alamat email asli Anda.');
      return;
    }

    setLoading(true);
    setSyncStatus(null);
    const res = await CloudSyncService.sendEmailOtp(email.trim());
    setLoading(false);

    if (res.success) {
      setOtpStep('verify');
      setCountdown(60);
      Alert.alert('Kode OTP Terkirim! 📬', res.message);
    } else {
      Alert.alert('Gagal Mengirim OTP', res.message || 'Periksa koneksi internet Anda.');
    }
  };

  // 2. Verifikasi Kode OTP 6-Digit
  const handleVerifyOtp = async () => {
    if (!otpToken.trim() || otpToken.trim().length < 6) {
      Alert.alert('Kode OTP Belum Lengkap', 'Masukkan 6-digit kode OTP yang dikirim ke email.');
      return;
    }

    setLoading(true);
    setSyncStatus(null);
    const res = await CloudSyncService.verifyEmailOtp(
      email.trim(),
      otpToken.trim(),
      fullName.trim(),
      className.trim()
    );
    setLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      Alert.alert('Login Berhasil! 🎉', `Selamat datang kembali, ${res.user.fullName}! Data Anda aman tersimpan.`);
      loadProfileAndStatus();
    } else {
      Alert.alert('Verifikasi Gagal', res.message || 'Kode OTP tidak cocok.');
    }
  };

  // 3. Password Fallback
  const handlePasswordSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Form Belum Lengkap', 'Masukkan email dan kata sandi.');
      return;
    }

    setLoading(true);
    setSyncStatus(null);

    let res;
    if (isRegisterMode) {
      res = await CloudSyncService.signUp(email, password, fullName, className);
    } else {
      res = await CloudSyncService.signIn(email, password);
    }
    setLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      Alert.alert('Berhasil! 🎉', isRegisterMode ? 'Akun Supabase berhasil dibuat!' : 'Berhasil masuk ke akun cloud!');
      loadProfileAndStatus();
    } else {
      Alert.alert('Gagal Autentikasi', res.message || 'Terjadi kesalahan.');
    }
  };

  const handleManualBackup = async () => {
    if (!currentUser) return;
    setLoading(true);
    setSyncStatus('Sedang mencadangkan seluruh data ke Supabase...');
    const res = await CloudSyncService.syncToCloud(currentUser.id);
    setLoading(false);
    setSyncStatus(res.message || null);
    loadProfileAndStatus();
  };

  const handleManualRestore = async () => {
    if (!currentUser) return;
    setLoading(true);
    setSyncStatus('Sedang memulihkan data dari Supabase Cloud...');
    const res = await CloudSyncService.syncFromCloud(currentUser.id);
    setLoading(false);
    setSyncStatus(res.message || null);
    loadProfileAndStatus();
  };

  const handleExportExcel = async () => {
    try {
      await ReportService.exportAndShareExcel();
    } catch (e) {
      Alert.alert('Gagal Ekspor', 'Tidak dapat membuat berkas Excel.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Konfirmasi Logout', 'Apakah Anda yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await CloudSyncService.signOut();
          setCurrentUser(null);
          setOtpStep('send');
          setOtpToken('');
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
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerIcon}>☁️</Text>
              <View>
                <Text style={styles.headerTitle}>Database Cloud & Akun</Text>
                <Text style={styles.headerSub}>Supabase Real-Time Backup</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {currentUser ? (
              // User is Logged In
              <View style={styles.loggedInBox}>
                <View style={styles.userCard}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{currentUser.fullName}</Text>
                    <Text style={styles.userEmail}>{currentUser.email}</Text>
                    <View style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>Kelas: {currentUser.className}</Text>
                    </View>
                  </View>
                </View>

                {lastSyncTime && (
                  <Text style={styles.lastSyncText}>Terakhir disinkronkan: {lastSyncTime}</Text>
                )}

                {syncStatus && (
                  <View style={styles.statusBox}>
                    <Text style={styles.statusBoxText}>✓ {syncStatus}</Text>
                  </View>
                )}

                {/* Cloud Actions */}
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={handleManualBackup}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnIcon}>⬆️</Text>
                    <Text style={styles.actionBtnText}>Backup ke Cloud</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={handleManualRestore}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnIcon}>⬇️</Text>
                    <Text style={styles.actionBtnText}>Restore Data</Text>
                  </TouchableOpacity>
                </View>

                {/* Export Excel Button */}
                <TouchableOpacity
                  style={styles.excelBtn}
                  onPress={handleExportExcel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.excelBtnIcon}>📗</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.excelBtnTitle}>Unduh Rekap Aktivitas Excel</Text>
                    <Text style={styles.excelBtnSub}>Format .csv komplit (Tugas, Absen GPS & QR, Jadwal)</Text>
                  </View>
                  <Text style={styles.excelBtnArrow}>Unduh ➔</Text>
                </TouchableOpacity>

                {loading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />}

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                  <Text style={styles.logoutText}>🚪 Keluar Akun (Logout)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Auth Form (OTP or Password)
              <View style={styles.formContainer}>
                {/* Method Switcher */}
                <View style={styles.methodRow}>
                  <TouchableOpacity
                    style={[styles.methodTab, authMethod === 'otp' && styles.activeMethodTab]}
                    onPress={() => setAuthMethod('otp')}
                  >
                    <Text style={[styles.methodTabText, authMethod === 'otp' && styles.activeMethodTabText]}>
                      📧 Email Asli & OTP
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.methodTab, authMethod === 'password' && styles.activeMethodTab]}
                    onPress={() => setAuthMethod('password')}
                  >
                    <Text style={[styles.methodTabText, authMethod === 'password' && styles.activeMethodTabText]}>
                      🔑 Password
                    </Text>
                  </TouchableOpacity>
                </View>

                {authMethod === 'otp' ? (
                  // REAL EMAIL OTP FLOW
                  <View>
                    <Text style={styles.otpBannerText}>
                      🔒 Masuk tanpa repot kata sandi! Kami akan mengirimkan 6-digit kode OTP asli ke email Anda.
                    </Text>

                    <Text style={styles.label}>Alamat Email Asli:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="contoh: idhambaihaqi@gmail.com"
                      placeholderTextColor={COLORS.textLight}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={otpStep === 'send' || !loading}
                    />

                    {otpStep === 'verify' ? (
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.label}>Masukkan 6-Digit Kode OTP:</Text>
                        <TextInput
                          style={[styles.input, styles.otpInput]}
                          placeholder="123456"
                          placeholderTextColor={COLORS.textLight}
                          value={otpToken}
                          onChangeText={setOtpToken}
                          keyboardType="number-pad"
                          maxLength={6}
                        />

                        <TouchableOpacity
                          style={[styles.primaryBtn, (!otpToken.trim() || loading) && styles.disabledBtn]}
                          onPress={handleVerifyOtp}
                          disabled={!otpToken.trim() || loading}
                          activeOpacity={0.8}
                        >
                          {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                          ) : (
                            <Text style={styles.primaryBtnText}>✓ Verifikasi & Masuk Akun</Text>
                          )}
                        </TouchableOpacity>

                        <View style={styles.resendRow}>
                          <TouchableOpacity
                            onPress={handleSendOtp}
                            disabled={countdown > 0 || loading}
                          >
                            <Text style={[styles.resendText, countdown > 0 && { color: COLORS.textMuted }]}>
                              {countdown > 0 ? `Kirim ulang kode dalam ${countdown}s` : 'Kirim Ulang Kode OTP'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setOtpStep('send')}>
                            <Text style={styles.changeEmailText}>Ganti Email</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.primaryBtn, (!email.trim() || loading) && styles.disabledBtn]}
                        onPress={handleSendOtp}
                        disabled={!email.trim() || loading}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <Text style={styles.primaryBtnText}>📨 Kirim Kode OTP ke Email</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  // PASSWORD FLOW
                  <View>
                    <View style={styles.tabToggle}>
                      <TouchableOpacity
                        style={[styles.toggleBtn, !isRegisterMode && styles.activeToggle]}
                        onPress={() => setIsRegisterMode(false)}
                      >
                        <Text style={[styles.toggleText, !isRegisterMode && styles.activeToggleText]}>Login</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleBtn, isRegisterMode && styles.activeToggle]}
                        onPress={() => setIsRegisterMode(true)}
                      >
                        <Text style={[styles.toggleText, isRegisterMode && styles.activeToggleText]}>Daftar Baru</Text>
                      </TouchableOpacity>
                    </View>

                    {isRegisterMode && (
                      <>
                        <Text style={styles.label}>Nama Lengkap Siswa:</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Idham Baihaqi"
                          placeholderTextColor={COLORS.textLight}
                          value={fullName}
                          onChangeText={setFullName}
                        />

                        <Text style={styles.label}>Kelas:</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="XII PPLG 3"
                          placeholderTextColor={COLORS.textLight}
                          value={className}
                          onChangeText={setClassName}
                        />
                      </>
                    )}

                    <Text style={styles.label}>Email:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="email@sekolah.sch.id"
                      placeholderTextColor={COLORS.textLight}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <Text style={styles.label}>Kata Sandi:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textLight}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />

                    <TouchableOpacity
                      style={[styles.primaryBtn, (!email.trim() || !password.trim() || loading) && styles.disabledBtn]}
                      onPress={handlePasswordSubmit}
                      disabled={!email.trim() || !password.trim() || loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={styles.primaryBtnText}>
                          {isRegisterMode ? 'Daftar Akun Cloud' : 'Masuk ke Akun Cloud'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  closeBtn: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 12,
  },
  loggedInBox: {
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBadge,
    gap: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  classBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  lastSyncText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusBoxText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnIcon: {
    fontSize: 18,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  excelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    gap: 10,
  },
  excelBtnIcon: {
    fontSize: 22,
  },
  excelBtnTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
  },
  excelBtnSub: {
    fontSize: 10,
    color: '#15803D',
    marginTop: 2,
  },
  excelBtnArrow: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#166534',
  },
  logoutBtn: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formContainer: {
    gap: 10,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  methodTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeMethodTab: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  methodTabText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeMethodTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  otpBannerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    lineHeight: 16,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 3,
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: COLORS.white,
    elevation: 1,
  },
  toggleText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeToggleText: {
    color: COLORS.primary,
    fontWeight: 'bold',
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textDark,
  },
  otpInput: {
    fontSize: 18,
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledBtn: {
    backgroundColor: COLORS.border,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  resendText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  changeEmailText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
});
