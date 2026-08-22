import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../constants/theme';
import { Header } from '../components/Header';
import {
  AttendanceRecord,
  AttendanceService,
  FriendStudent,
  QRCodeData,
  SavedLocation,
  StudentAuth,
} from '../services/attendanceService';
import { MapPickerModal } from '../components/MapPickerModal';

interface AttendanceScreenProps {
  currentClass: string;
  onOpenSettings?: () => void;
  onVoiceAIPress?: () => void;
}

type TabType = 'presence' | 'friends' | 'locations' | 'qr' | 'history';

export const AttendanceScreen: React.FC<AttendanceScreenProps> = ({
  currentClass,
  onOpenSettings,
  onVoiceAIPress,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('presence');
  const [auth, setAuth] = useState<StudentAuth | null>(null);
  const [nis, setNis] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Locations & Map Picker
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<SavedLocation | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [apiSearchResults, setApiSearchResults] = useState<SavedLocation[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocLat, setNewLocLat] = useState('-7.433924');
  const [newLocLng, setNewLocLng] = useState('109.248612');

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
    loadInitialData();
  }, []);

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

  const handleSubmitPresence = async (type: 'DATANG' | 'PULANG') => {
    if (!selectedLoc) {
      Alert.alert('Pilih Lokasi', 'Silakan tentukan titik lokasi presensi terlebih dahulu.');
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

  const handleBatchPresence = async (type: 'DATANG' | 'PULANG') => {
    if (!selectedLoc) return;
    if (friends.length === 0) {
      Alert.alert('Daftar Teman Kosong', 'Tambahkan teman di tab "👥 Teman" terlebih dahulu.');
      return;
    }

    Alert.alert(
      'Konfirmasi Titip Absen Massal',
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

  const handleSelectFromMap = async (loc: SavedLocation) => {
    await AttendanceService.saveLocation(loc);
    const list = await AttendanceService.getLocations();
    setLocations(list);
    setSelectedLoc(loc);
    Alert.alert('Lokasi Terpasang! 📍', `Titik ${loc.name} (${loc.latitude}, ${loc.longitude}) siap digunakan.`);
  };

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
    Alert.alert('Teman Ditambahkan! 👥', `${newFr.name} berhasil disimpan.`);
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

  const handleSearchApiLocations = async () => {
    if (!locationSearch.trim()) return;
    setIsSearchingApi(true);
    const results = await AttendanceService.searchOfficialLocations(locationSearch.trim());
    setIsSearchingApi(false);
    setApiSearchResults(results);
  };

  const handleSelectApiResult = async (item: SavedLocation) => {
    await AttendanceService.saveLocation(item);
    const list = await AttendanceService.getLocations();
    setLocations(list);
    setSelectedLoc(item);
    setApiSearchResults([]);
    setLocationSearch('');
    Alert.alert('Lokasi API Terpasang! 📍', `Titik ${item.name} (${item.latitude}, ${item.longitude}) berhasil disimpan.`);
  };

  const handleAddLocation = async () => {
    if (!newLocName.trim() || isNaN(Number(newLocLat)) || isNaN(Number(newLocLng))) {
      Alert.alert('Lengkapi Data', 'Nama dan koordinat Latitude/Longitude harus valid.');
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
    Alert.alert('Hapus Lokasi', 'Hapus titik koordinat ini?', [
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
    Alert.alert('QR Code Ter-embed! 📷', 'Payload QR kehadiran berhasil disimpan.');
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

  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredFriends = friends.filter(
    f =>
      f.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
      f.nis.includes(friendSearch)
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="ABSENSI MANDIRI"
        subtitle="Presensi Digits Telkom"
        currentClass={currentClass}
        onClassPress={onOpenSettings}
        onVoiceAIPress={onVoiceAIPress}
      />

      {/* Tabs Row */}
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

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* 1. PRESENCE TAB */}
        {activeTab === 'presence' && (
          <View style={styles.tabContent}>
            {auth ? (
              <>
                <Text style={styles.sectionLabel}>Target Presensi:</Text>
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

                {/* Banner Buka Peta Interaktif Leaflet */}
                <TouchableOpacity
                  style={styles.openMapBanner}
                  onPress={() => setShowMapPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.openMapBannerIcon}>🗺️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.openMapBannerTitle}>Pilih Titik di Peta Interaktif</Text>
                    <Text style={styles.openMapBannerSub}>
                      Geser peta OpenStreetMap Leaflet & letakkan pin koordinat presisi
                    </Text>
                  </View>
                  <Text style={styles.openMapArrow}>Buka Peta ➔</Text>
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Titik Lokasi Presensi Terpilih:</Text>
                <View style={styles.selectedLocCard}>
                  <View style={styles.selectedLocInfo}>
                    <Text style={styles.selectedLocName}>
                      📍 {selectedLoc?.name || 'Belum dipilih'}
                    </Text>
                    <Text style={styles.selectedLocCoords}>
                      Lat: {selectedLoc?.latitude} | Long: {selectedLoc?.longitude}
                    </Text>
                    {selectedLoc?.address && (
                      <Text style={styles.selectedLocAddress} numberOfLines={2}>
                        {selectedLoc.address}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.changeLocBtn}
                    onPress={() => setShowMapPicker(true)}
                  >
                    <Text style={styles.changeLocText}>Peta 🗺️</Text>
                  </TouchableOpacity>
                </View>

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

        {/* 2. FRIENDS TAB */}
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

        {/* 3. LOCATIONS TAB */}
        {activeTab === 'locations' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={styles.openMapLargeBtn}
              onPress={() => setShowMapPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.openMapLargeIcon}>🗺️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.openMapLargeTitle}>Buka Peta Satelit & Pilih Titik Pin</Text>
                <Text style={styles.openMapLargeSub}>
                  Geser peta Leaflet CartoDB untuk memilih koordinat presisi tinggi
                </Text>
              </View>
              <Text style={styles.openMapLargeBadge}>BUKA ➔</Text>
            </TouchableOpacity>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Cari lokasi / gedung via API Geocoding..."
                placeholderTextColor={COLORS.textLight}
                value={locationSearch}
                onChangeText={setLocationSearch}
                onSubmitEditing={handleSearchApiLocations}
              />
              <TouchableOpacity
                style={styles.searchApiBtn}
                onPress={handleSearchApiLocations}
                disabled={isSearchingApi}
              >
                {isSearchingApi ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.searchApiBtnText}>Cari API</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addSmallBtn}
                onPress={() => setShowAddLocation(!showAddLocation)}
              >
                <Text style={styles.addSmallBtnText}>
                  {showAddLocation ? '✕' : '+ Manual'}
                </Text>
              </TouchableOpacity>
            </View>

            {apiSearchResults.length > 0 && (
              <View style={styles.apiResultBox}>
                <Text style={styles.apiResultTitle}>Hasil Pencarian API Geocoding:</Text>
                {apiSearchResults.map(res => (
                  <TouchableOpacity
                    key={res.id}
                    style={styles.apiResultItem}
                    onPress={() => handleSelectApiResult(res)}
                  >
                    <Text style={styles.apiResultName}>📍 {res.name}</Text>
                    <Text style={styles.apiResultAddress} numberOfLines={2}>
                      {res.address}
                    </Text>
                    <Text style={styles.apiResultCoords}>
                      Lat: {res.latitude} | Long: {res.longitude}
                    </Text>
                    <Text style={styles.embedHint}>+ Gunakan Titik Ini ↗</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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

            <Text style={styles.sectionLabel}>Titik Lokasi Tersimpan & Resmi:</Text>
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
                    {loc.address && (
                      <Text style={styles.listItemAddress} numberOfLines={1}>
                        {loc.address}
                      </Text>
                    )}
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

        <View style={{ height: 60 }} />
      </ScrollView>

      <MapPickerModal
        visible={showMapPicker}
        initialLocation={selectedLoc}
        onClose={() => setShowMapPicker(false)}
        onSelectLocation={handleSelectFromMap}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  scrollArea: {
    flex: 1,
    padding: 14,
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
    backgroundColor: COLORS.white,
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
  openMapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  openMapBannerIcon: {
    fontSize: 24,
  },
  openMapBannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  openMapBannerSub: {
    fontSize: 10,
    color: '#3B82F6',
    marginTop: 2,
  },
  openMapArrow: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  openMapLargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  openMapLargeIcon: {
    fontSize: 26,
  },
  openMapLargeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  openMapLargeSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  openMapLargeBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  selectedLocCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  selectedLocInfo: {
    flex: 1,
  },
  selectedLocName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  selectedLocCoords: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  selectedLocAddress: {
    fontSize: 10,
    color: COLORS.textBody,
    marginTop: 2,
  },
  changeLocBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    fontSize: 24,
    marginBottom: 4,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  actionBtnSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    marginTop: 2,
  },
  batchBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  batchBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  loginCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  loginTitle: {
    fontSize: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: COLORS.textDark,
  },
  textArea: {
    height: 80,
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
    gap: 6,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 11,
  },
  searchApiBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchApiBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 10,
  },
  addSmallBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSmallBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 10,
  },
  apiResultBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  apiResultTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  apiResultItem: {
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  apiResultName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  apiResultAddress: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  apiResultCoords: {
    fontSize: 9,
    color: '#1D4ED8',
    marginTop: 2,
    fontWeight: '600',
  },
  embedHint: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: 'bold',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  formBox: {
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  formBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  saveFormBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveFormBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 11,
  },
  uploadQRBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadQRText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  listItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
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
  listItemAddress: {
    fontSize: 9,
    color: COLORS.textBody,
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
    backgroundColor: COLORS.white,
    padding: 10,
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
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
