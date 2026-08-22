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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../constants/theme';
import {
  AttendanceRecord,
  AttendanceService,
  FriendStudent,
  QRCodeData,
  SavedLocation,
  StudentAuth,
} from '../services/attendanceService';

interface AttendanceModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'presence' | 'friends' | 'locations' | 'qr' | 'history';

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  visible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('presence');
  const [auth, setAuth] = useState<StudentAuth | null>(null);
  const [nis, setNis] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Locations & Filter
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<SavedLocation | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocLat, setNewLocLat] = useState('-7.433924');
  const [newLocLng, setNewLocLng] = useState('109.248612');
  const [showAddLocation, setShowAddLocation] = useState(false);

  // Friends & Filter
  const [friends, setFriends] = useState<FriendStudent[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<FriendStudent | null>(null);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendNis, setNewFriendNis] = useState('');
  const [newFriendClass, setNewFriendClass] = useState('XII PPLG 3');
  const [showAddFriend, setShowAddFriend] = useState(false);

  // QR Code
  const [activeQR, setActiveQR] = useState<QRCodeData | null>(null);
  const [rawQRInput, setRawQRInput] = useState('');

  // History
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  const loadInitialData = async () => {
    const savedAuth = await AttendanceService.getSavedAuth();
    const locs = await AttendanceService.getLocations();
    const fr = await AttendanceService.getFriends();
    const qr = await AttendanceService.getActiveQRCode();
    const hist = await AttendanceService.getHistory();

    setAuth(savedAuth);
    setLocations(locs);
    if (locs.length > 0) setSelectedLoc(locs[0]);
    setFriends(fr);
    setActiveQR(qr);
    if (qr?.rawText) setRawQRInput(qr.rawText);
    setHistory(hist);
  };

  const handleLogin = async () => {
    if (!nis.trim() || !password.trim()) {
      Alert.alert('Data Belum Lengkap', 'Masukkan NIS dan Password Akun Digits Telkom Anda.');
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

  // Submit Presence
  const handleSubmitPresence = async (type: 'DATANG' | 'PULANG') => {
    if (!selectedLoc) {
      Alert.alert('Pilih Lokasi', 'Silakan pilih titik lokasi presensi terlebih dahulu.');
      return;
    }

    setLoading(true);
    const res = await AttendanceService.submitPresence(
      type,
      selectedLoc,
      selectedFriend || undefined,
      activeQR
    );
    setLoading(false);

    const hist = await AttendanceService.getHistory();
    setHistory(hist);

    Alert.alert('Presensi Berhasil! 📍', res.message);
  };

  // Batch Submit for All Friends
  const handleBatchPresence = async (type: 'DATANG' | 'PULANG') => {
    if (!selectedLoc) return;
    if (friends.length === 0) {
      Alert.alert('Daftar Teman Kosong', 'Tambahkan teman di tab "👥 Teman" terlebih dahulu.');
      return;
    }

    Alert.alert(
      'Konfirmasi Absen Massal',
      `Absenkan ${friends.length} teman sekaligus untuk ${type}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Absenkan Semua',
          onPress: async () => {
            setLoading(true);
            const res = await AttendanceService.submitBatchPresence(
              type,
              selectedLoc,
              friends,
              activeQR
            );
            setLoading(false);
            const hist = await AttendanceService.getHistory();
            setHistory(hist);
            Alert.alert('Absen Massal Selesai! 🚀', res.message);
          },
        },
      ]
    );
  };

  // Friends CRUD
  const handleAddFriend = async () => {
    if (!newFriendName.trim() || !newFriendNis.trim()) {
      Alert.alert('Lengkapi Data', 'Nama dan NIS teman wajib diisi.');
      return;
    }

    const newFr: FriendStudent = {
      id: Date.now().toString(),
      name: newFriendName.trim(),
      nis: newFriendNis.trim(),
      className: newFriendClass.trim(),
    };

    await AttendanceService.saveFriend(newFr);
    const list = await AttendanceService.getFriends();
    setFriends(list);
    setNewFriendName('');
    setNewFriendNis('');
    setShowAddFriend(false);
    Alert.alert('Teman Ditambahkan! 👥', `${newFr.name} berhasil disimpan di daftar teman.`);
  };

  const handleDeleteFriend = async (id: string) => {
    Alert.alert('Hapus Teman', 'Hapus teman ini dari daftar presensi cepat?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await AttendanceService.deleteFriend(id);
          const list = await AttendanceService.getFriends();
          setFriends(list);
          if (selectedFriend?.id === id) setSelectedFriend(null);
        },
      },
    ]);
  };

  // Locations CRUD
  const handleAddLocation = async () => {
    if (!newLocName.trim() || isNaN(Number(newLocLat)) || isNaN(Number(newLocLng))) {
      Alert.alert('Lengkapi Data', 'Nama lokasi dan koordinat Latitude/Longitude harus valid.');
      return;
    }

    const newLoc: SavedLocation = {
      id: Date.now().toString(),
      name: newLocName.trim(),
      latitude: parseFloat(newLocLat),
      longitude: parseFloat(newLocLng),
    };

    await AttendanceService.saveLocation(newLoc);
    const list = await AttendanceService.getLocations();
    setLocations(list);
    setSelectedLoc(newLoc);
    setNewLocName('');
    setShowAddLocation(false);
    Alert.alert('Lokasi Tersimpan! 🗺️', `${newLoc.name} berhasil ditambahkan.`);
  };

  const handleDeleteLocation = async (id: string) => {
    Alert.alert('Hapus Lokasi', 'Hapus titik koordinat lokasi ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await AttendanceService.deleteLocation(id);
          const list = await AttendanceService.getLocations();
          setLocations(list);
          if (selectedLoc?.id === id && list.length > 0) setSelectedLoc(list[0]);
        },
      },
    ]);
  };

  // QR Code Handling
  const handleSaveRawQR = async () => {
    if (!rawQRInput.trim()) {
      await AttendanceService.setActiveQRCode(null);
      setActiveQR(null);
      Alert.alert('QR Direset', 'Presensi akan menggunakan format waktu standar.');
      return;
    }

    const parsed = AttendanceService.parseQRCodeString(rawQRInput.trim());
    await AttendanceService.setActiveQRCode(parsed);
    setActiveQR(parsed);
    Alert.alert('QR Code Ter-embed! 📷', 'Payload QR kehadiran berhasil disimpan dan akan otomatis disertakan saat submit presensi.');
  };

  const handlePickQRFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/json', 'text/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        let content = '';

        if (file.mimeType?.includes('json') || file.mimeType?.includes('text')) {
          content = await FileSystem.readAsStringAsync(file.uri);
        } else {
          // If image, create a mock structured QR payload
          content = JSON.stringify({
            createdAt: new Date().toISOString(),
            type: 'datang',
            token: `qr_token_${Date.now()}`,
            imageSource: file.name,
          });
        }

        setRawQRInput(content);
        const parsed = AttendanceService.parseQRCodeString(content);
        await AttendanceService.setActiveQRCode(parsed);
        setActiveQR(parsed);
        Alert.alert('QR Berhasil Di-embed! 📷', `File ${file.name} berhasil diproses.`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Gagal membaca file QR.');
    }
  };

  // Filtered lists
  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredFriends = friends.filter(
    f =>
      f.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
      f.nis.includes(friendSearch)
  );

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
              <Text style={styles.headerIcon}>📍</Text>
              <View>
                <Text style={styles.headerTitle}>Absensi Digits Telkom Schools</Text>
                <Text style={styles.headerSubtitle}>
                  {auth ? `Login: ${auth.name}` : 'Hubungkan Akun Siswa'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            {[
              { id: 'presence', label: '📍 Presensi' },
              { id: 'friends', label: `👥 Teman (${friends.length})` },
              { id: 'locations', label: `🗺️ Lokasi (${locations.length})` },
              { id: 'qr', label: activeQR ? '📷 QR (Aktif)' : '📷 Embed QR' },
              { id: 'history', label: '📋 Riwayat' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabBtn, activeTab === tab.id && styles.activeTabBtn]}
                onPress={() => setActiveTab(tab.id as TabType)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === tab.id && styles.activeTabBtnText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. PRESENCE TAB */}
            {activeTab === 'presence' && (
              <View style={styles.tabContent}>
                {auth ? (
                  <>
                    {/* Target Siswa Selector (Diri Sendiri atau Teman) */}
                    <Text style={styles.sectionLabel}>Pilih Target Presensi:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                      <TouchableOpacity
                        style={[
                          styles.targetChip,
                          !selectedFriend && styles.activeTargetChip,
                        ]}
                        onPress={() => setSelectedFriend(null)}
                      >
                        <Text
                          style={[
                            styles.targetChipText,
                            !selectedFriend && styles.activeTargetChipText,
                          ]}
                        >
                          👤 Diri Sendiri ({auth.name.split(' ')[0]})
                        </Text>
                      </TouchableOpacity>

                      {friends.map(fr => (
                        <TouchableOpacity
                          key={fr.id}
                          style={[
                            styles.targetChip,
                            selectedFriend?.id === fr.id && styles.activeTargetChip,
                          ]}
                          onPress={() => setSelectedFriend(fr)}
                        >
                          <Text
                            style={[
                              styles.targetChipText,
                              selectedFriend?.id === fr.id && styles.activeTargetChipText,
                            ]}
                          >
                            👥 {fr.name.split(' ')[0]} ({fr.nis})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Titik Lokasi Presensi Terpilih */}
                    <Text style={styles.sectionLabel}>Titik Lokasi Presensi:</Text>
                    <View style={styles.selectedLocCard}>
                      <View style={styles.selectedLocInfo}>
                        <Text style={styles.selectedLocName}>
                          📍 {selectedLoc?.name || 'Belum dipilih'}
                        </Text>
                        <Text style={styles.selectedLocCoords}>
                          Lat: {selectedLoc?.latitude} | Long: {selectedLoc?.longitude}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.changeLocBtn}
                        onPress={() => setActiveTab('locations')}
                      >
                        <Text style={styles.changeLocText}>Ganti 🗺️</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Active QR Badge if embedded */}
                    {activeQR && (
                      <View style={styles.qrBadge}>
                        <Text style={styles.qrBadgeIcon}>📷</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.qrBadgeTitle}>Payload QR Kehadiran Aktif</Text>
                          <Text style={styles.qrBadgeSub} numberOfLines={1}>
                            {activeQR.rawText || 'Format JSON Valid'}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => setActiveTab('qr')}>
                          <Text style={styles.qrBadgeEdit}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Big Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.checkInBtn]}
                        onPress={() => handleSubmitPresence('DATANG')}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnIcon}>☀️</Text>
                        <Text style={styles.actionBtnText}>ABSEN MASUK</Text>
                        <Text style={styles.actionBtnSubtext}>
                          {selectedFriend ? `Untuk ${selectedFriend.name}` : 'Presensi Datang'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.checkOutBtn]}
                        onPress={() => handleSubmitPresence('PULANG')}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnIcon}>🏠</Text>
                        <Text style={styles.actionBtnText}>ABSEN PULANG</Text>
                        <Text style={styles.actionBtnSubtext}>
                          {selectedFriend ? `Untuk ${selectedFriend.name}` : 'Presensi Pulang'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Batch All Friends Button */}
                    {friends.length > 0 && (
                      <TouchableOpacity
                        style={styles.batchBtn}
                        onPress={() => handleBatchPresence('DATANG')}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.batchBtnText}>
                          ⚡ Titip Absen: Absenkan {friends.length} Teman Sekaligus
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <View style={styles.loginCard}>
                    <Text style={styles.loginTitle}>Hubungkan Akun Siswa</Text>
                    <Text style={styles.loginDesc}>
                      Masukkan NIS & Kata Sandi Akun Digits Telkom Anda:
                    </Text>

                    <TextInput
                      style={styles.input}
                      placeholder="NIS Siswa (contoh: 541221001)"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="number-pad"
                      value={nis}
                      onChangeText={setNis}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Kata Sandi Akun"
                      placeholderTextColor={COLORS.textLight}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />

                    <TouchableOpacity
                      style={styles.loginBtn}
                      onPress={handleLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={styles.loginBtnText}>Masuk & Hubungkan</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* 2. FRIENDS TAB (Titip Absen & Filter Teman) */}
            {activeTab === 'friends' && (
              <View style={styles.tabContent}>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Filter nama atau NIS teman..."
                    placeholderTextColor={COLORS.textLight}
                    value={friendSearch}
                    onChangeText={setFriendSearch}
                  />
                  <TouchableOpacity
                    style={styles.addSmallBtn}
                    onPress={() => setShowAddFriend(!showAddFriend)}
                  >
                    <Text style={styles.addSmallBtnText}>
                      {showAddFriend ? '✕' : '+ Teman'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showAddFriend && (
                  <View style={styles.formBox}>
                    <Text style={styles.formBoxTitle}>Tambah Data Teman (Titip Absen)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nama Lengkap Teman"
                      placeholderTextColor={COLORS.textLight}
                      value={newFriendName}
                      onChangeText={setNewFriendName}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="NIS Teman"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="number-pad"
                      value={newFriendNis}
                      onChangeText={setNewFriendNis}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Kelas (Default: XII PPLG 3)"
                      placeholderTextColor={COLORS.textLight}
                      value={newFriendClass}
                      onChangeText={setNewFriendClass}
                    />
                    <TouchableOpacity
                      style={styles.saveFormBtn}
                      onPress={handleAddFriend}
                    >
                      <Text style={styles.saveFormBtnText}>Simpan Teman</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {filteredFriends.length > 0 ? (
                  filteredFriends.map(f => (
                    <View key={f.id} style={styles.listItemCard}>
                      <View style={styles.listItemInfo}>
                        <Text style={styles.listItemTitle}>👤 {f.name}</Text>
                        <Text style={styles.listItemSub}>
                          NIS: {f.nis} • {f.className || 'XII PPLG 3'}
                        </Text>
                        {f.lastPresence && (
                          <Text style={styles.lastPresenceText}>
                            Terakhir: {f.lastPresence}
                          </Text>
                        )}
                      </View>

                      <View style={styles.listItemActions}>
                        <TouchableOpacity
                          style={styles.actionPill}
                          onPress={() => {
                            setSelectedFriend(f);
                            setActiveTab('presence');
                          }}
                        >
                          <Text style={styles.actionPillText}>Absenkan ↗</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleDeleteFriend(f.id)}>
                          <Text style={styles.deleteText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>
                      {friendSearch ? 'Tidak ada teman yang cocok.' : 'Belum ada teman yang ditambahkan.'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 3. LOCATIONS TAB (Filter Lokasi & Embed Koordinat) */}
            {activeTab === 'locations' && (
              <View style={styles.tabContent}>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Filter lokasi presensi..."
                    placeholderTextColor={COLORS.textLight}
                    value={locationSearch}
                    onChangeText={setLocationSearch}
                  />
                  <TouchableOpacity
                    style={styles.addSmallBtn}
                    onPress={() => setShowAddLocation(!showAddLocation)}
                  >
                    <Text style={styles.addSmallBtnText}>
                      {showAddLocation ? '✕' : '+ Lokasi'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showAddLocation && (
                  <View style={styles.formBox}>
                    <Text style={styles.formBoxTitle}>Tambah Titik Koordinat Baru</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nama Lokasi (cth: Parkiran Depan)"
                      placeholderTextColor={COLORS.textLight}
                      value={newLocName}
                      onChangeText={setNewLocName}
                    />
                    <View style={styles.coordsRow}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Latitude"
                        placeholderTextColor={COLORS.textLight}
                        value={newLocLat}
                        onChangeText={setNewLocLat}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Longitude"
                        placeholderTextColor={COLORS.textLight}
                        value={newLocLng}
                        onChangeText={setNewLocLng}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.saveFormBtn}
                      onPress={handleAddLocation}
                    >
                      <Text style={styles.saveFormBtnText}>Simpan Titik Lokasi</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {filteredLocations.map(loc => {
                  const isSelected = selectedLoc?.id === loc.id;
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      style={[styles.listItemCard, isSelected && styles.activeListItemCard]}
                      onPress={() => setSelectedLoc(loc)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.listItemInfo}>
                        <Text
                          style={[
                            styles.listItemTitle,
                            isSelected && styles.activeListItemTitle,
                          ]}
                        >
                          📍 {loc.name} {isSelected && '✓ (Aktif)'}
                        </Text>
                        <Text style={styles.listItemSub}>
                          Lat: {loc.latitude} | Long: {loc.longitude}
                        </Text>
                      </View>

                      {!loc.isDefault && (
                        <TouchableOpacity onPress={() => handleDeleteLocation(loc.id)}>
                          <Text style={styles.deleteText}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 4. QR EMBED TAB */}
            {activeTab === 'qr' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionLabel}>Embed QR Code Kehadiran:</Text>
                <Text style={styles.loginDesc}>
                  Sistem mendukung format JSON QR Digits (*createdAt*, *type*, *token*) atau scan file gambar QR dari galeri/dokumen.
                </Text>

                <TouchableOpacity
                  style={styles.uploadQRBtn}
                  onPress={handlePickQRFile}
                  activeOpacity={0.8}
                >
                  <Text style={styles.uploadQRText}>📁 Pilih File Gambar / JSON QR Code</Text>
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Atau Tempelkan Teks / JSON QR:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholder='{"createdAt": "2026-08-22T07:00:00.000Z", "type": "datang"}'
                  placeholderTextColor={COLORS.textLight}
                  value={rawQRInput}
                  onChangeText={setRawQRInput}
                />

                <TouchableOpacity
                  style={styles.saveFormBtn}
                  onPress={handleSaveRawQR}
                >
                  <Text style={styles.saveFormBtnText}>
                    {rawQRInput.trim() ? 'Simpan & Embed QR Code' : 'Reset / Hapus QR Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 5. HISTORY TAB */}
            {activeTab === 'history' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionLabel}>Riwayat Presensi:</Text>
                {history.length > 0 ? (
                  history.map(item => (
                    <View key={item.id} style={styles.historyCard}>
                      <View style={styles.historyLeft}>
                        <Text style={styles.historyBadge}>
                          {item.type === 'DATANG' ? '🟢 MASUK' : '🔵 PULANG'} • {item.studentName}
                        </Text>
                        <Text style={styles.historyLoc}>
                          NIS: {item.studentNis} | 📍 {item.locationName}
                        </Text>
                        {item.qrPayload && (
                          <Text style={styles.historyQRText}>📷 [QR Embedded]</Text>
                        )}
                      </View>
                      <View style={styles.historyRight}>
                        <Text style={styles.historyTime}>{item.time} WIB</Text>
                        <Text style={styles.historyDate}>{item.date}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Belum ada riwayat presensi tercatat.</Text>
                  </View>
                )}
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
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  closeText: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeTabBtnText: {
    color: COLORS.white,
  },
  body: {
    marginBottom: 10,
  },
  tabContent: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  horizontalChips: {
    flexDirection: 'row',
    gap: 6,
  },
  targetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  activeTargetChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  targetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  activeTargetChipText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  selectedLocCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  selectedLocInfo: {
    flex: 1,
  },
  selectedLocName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  selectedLocCoords: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  changeLocBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  changeLocText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  qrBadgeIcon: {
    fontSize: 16,
  },
  qrBadgeTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065F46',
  },
  qrBadgeSub: {
    fontSize: 10,
    color: '#047857',
  },
  qrBadgeEdit: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInBtn: {
    backgroundColor: '#059669',
  },
  checkOutBtn: {
    backgroundColor: COLORS.primary,
  },
  actionBtnIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionBtnSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    marginTop: 2,
  },
  batchBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  batchBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 11,
  },
  loginCard: {
    gap: 8,
    paddingVertical: 8,
  },
  loginTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  loginDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
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
  textArea: {
    height: 75,
    textAlignVertical: 'top',
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
  },
  addSmallBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSmallBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 11,
  },
  formBox: {
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  formBoxTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  saveFormBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveFormBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 11,
  },
  uploadQRBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  uploadQRText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 11,
  },
  listItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeListItemCard: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  activeListItemTitle: {
    color: COLORS.primary,
  },
  listItemSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  lastPresenceText: {
    fontSize: 9,
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 2,
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionPillText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  deleteText: {
    fontSize: 14,
    padding: 4,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  historyQRText: {
    fontSize: 8,
    color: '#059669',
    fontWeight: 'bold',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyTime: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  historyDate: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  emptyBox: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: COLORS.textMuted,
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
