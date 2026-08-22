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
import { AttendanceRecord, AttendanceService, SavedLocation, StudentAuth } from '../services/attendanceService';

interface AttendanceModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  visible,
  onClose,
}) => {
  const [auth, setAuth] = useState<StudentAuth | null>(null);
  const [nis, setNis] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<SavedLocation | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  const loadInitialData = async () => {
    const savedAuth = await AttendanceService.getSavedAuth();
    const locs = await AttendanceService.getLocations();
    const hist = await AttendanceService.getHistory();
    setAuth(savedAuth);
    setLocations(locs);
    if (locs.length > 0) setSelectedLoc(locs[0]);
    setHistory(hist);
  };

  const handleLogin = async () => {
    if (!nis.trim() || !password.trim()) {
      Alert.alert('Data Belum Lengkap', 'Masukkan NIS dan Password Anda.');
      return;
    }

    setLoading(true);
    const res = await AttendanceService.loginStudent(nis.trim(), password.trim());
    setLoading(false);

    if (res.success && res.data) {
      setAuth(res.data);
      Alert.alert('Login Berhasil! 🎓', `Selamat datang, ${res.data.name}!`);
    } else {
      Alert.alert('Gagal Login', res.message || 'Periksa kembali kredensial Anda.');
    }
  };

  const handleLogout = async () => {
    await AttendanceService.clearAuth();
    setAuth(null);
    setNis('');
    setPassword('');
  };

  const handleSubmitPresence = async (type: 'DATANG' | 'PULANG') => {
    if (!selectedLoc) return;

    setLoading(true);
    const res = await AttendanceService.submitPresence(type, selectedLoc);
    setLoading(false);

    const hist = await AttendanceService.getHistory();
    setHistory(hist);

    Alert.alert('Presensi Tercatat! 📍', res.message);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>📍</Text>
              <Text style={styles.headerTitle}>Absensi Mandiri (Digits Telkom)</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {auth ? (
              <View style={styles.userSection}>
                {/* Profile Card */}
                <View style={styles.profileBadge}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>🎓</Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.userName}>{auth.name}</Text>
                    <Text style={styles.userNis}>NIS: {auth.nis} • {auth.school}</Text>
                  </View>
                  <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logoutText}>Ganti</Text>
                  </TouchableOpacity>
                </View>

                {/* Pilih Lokasi Titik Absen */}
                <Text style={styles.label}>Pilih Titik Lokasi Presensi</Text>
                <View style={styles.locContainer}>
                  {locations.map(loc => {
                    const isSelected = selectedLoc?.id === loc.id;
                    return (
                      <TouchableOpacity
                        key={loc.id}
                        style={[styles.locChip, isSelected && styles.activeLocChip]}
                        onPress={() => setSelectedLoc(loc)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.locChipText, isSelected && styles.activeLocChipText]}
                        >
                          📍 {loc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Big Action Buttons (Absen Masuk / Pulang) */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.checkInBtn]}
                    onPress={() => handleSubmitPresence('DATANG')}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnIcon}>☀️</Text>
                    <Text style={styles.actionBtnText}>ABSEN MASUK</Text>
                    <Text style={styles.actionBtnSubtext}>Datang ke Sekolah</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.checkOutBtn]}
                    onPress={() => handleSubmitPresence('PULANG')}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnIcon}>🏠</Text>
                    <Text style={styles.actionBtnText}>ABSEN PULANG</Text>
                    <Text style={styles.actionBtnSubtext}>Selesai Belajar</Text>
                  </TouchableOpacity>
                </View>

                {/* Riwayat Presensi Hari Ini */}
                <Text style={styles.label}>Riwayat Presensi</Text>
                {history.length > 0 ? (
                  history.slice(0, 5).map(item => (
                    <View key={item.id} style={styles.historyCard}>
                      <View style={styles.historyLeft}>
                        <Text style={styles.historyBadge}>
                          {item.type === 'DATANG' ? '🟢 MASUK' : '🔵 PULANG'}
                        </Text>
                        <Text style={styles.historyLoc}>{item.locationName}</Text>
                      </View>
                      <View style={styles.historyRight}>
                        <Text style={styles.historyTime}>{item.time} WIB</Text>
                        <Text style={styles.historyDate}>{item.date}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Belum ada riwayat presensi hari ini.</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.loginForm}>
                <Text style={styles.loginTitle}>Hubungkan Akun Presensi Siswa</Text>
                <Text style={styles.loginDesc}>
                  Gunakan NIS & Kata Sandi Akun Digits Telkom Schools Anda untuk melakukan presensi mandiri kapan saja.
                </Text>

                <Text style={styles.label}>NIS Siswa</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: 541221001"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="number-pad"
                  value={nis}
                  onChangeText={setNis}
                />

                <Text style={styles.label}>Kata Sandi</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan kata sandi..."
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.loginBtnText}>Masuk & Hubungkan Akun</Text>
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
    maxHeight: '90%',
    padding: 20,
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  closeText: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 12,
  },
  userSection: {
    gap: 12,
  },
  profileBadge: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userNis: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logoutText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: 'bold',
    padding: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 6,
  },
  locContainer: {
    gap: 6,
  },
  locChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
  },
  activeLocChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  locChipText: {
    fontSize: 12,
    color: COLORS.textBody,
    fontWeight: '600',
  },
  activeLocChipText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  checkInBtn: {
    backgroundColor: '#059669',
  },
  checkOutBtn: {
    backgroundColor: COLORS.primary,
  },
  actionBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  actionBtnSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  historyLeft: {
    flex: 1,
  },
  historyBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  historyLoc: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  historyDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  emptyBox: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  loginForm: {
    gap: 10,
    paddingVertical: 10,
  },
  loginTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  loginDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textDark,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  footer: {
    paddingTop: 8,
  },
  closeBtn: {
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtnText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
