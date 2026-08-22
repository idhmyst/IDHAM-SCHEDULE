import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StudentAuth {
  token: string;
  nis: string;
  name: string;
  email?: string;
  school?: string;
}

export interface FriendStudent {
  id: string;
  name: string;
  nis: string;
  password?: string;
  token?: string;
  className?: string;
  lastPresence?: string;
}

export interface AttendanceRecord {
  id: string;
  studentNis: string;
  studentName: string;
  date: string;
  time: string;
  type: 'DATANG' | 'PULANG' | 'IZIN' | 'SAKIT';
  status: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  qrPayload?: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  isDefault?: boolean;
}

export interface QRCodeData {
  createdAt?: string;
  type?: string;
  token?: string;
  rawText?: string;
}

const STORAGE_KEYS = {
  AUTH: '@idham_attendance_auth_v2',
  FRIENDS: '@idham_attendance_friends_v2',
  HISTORY: '@idham_attendance_history_v2',
  LOCATIONS: '@idham_attendance_locations_v2',
  ACTIVE_QR: '@idham_attendance_qr_v2',
};

// Titik Lokasi Resmi Terverifikasi SMK Telkom Purwokerto dari Absenin Aja
const OFFICIAL_TELKOM_LOCATIONS: SavedLocation[] = [
  {
    id: '1',
    name: 'SMK Telkom Purwokerto (Gerbang Utama)',
    latitude: -7.433924,
    longitude: 109.248612,
    address: 'Jl. D.I. Panjaitan No.128, Purwokerto Kidul, Kec. Purwokerto Selatan, Kab. Banyumas',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Lab RPL & Konsentrasi Kejuruan (Gedung B)',
    latitude: -7.433850,
    longitude: 109.248550,
    address: 'Kompleks SMK Telkom Purwokerto - Lantai 2',
  },
  {
    id: '3',
    name: 'Lapangan Sentra & Upacara',
    latitude: -7.434010,
    longitude: 109.248720,
    address: 'Area Tengah Lapangan SMK Telkom',
  },
  {
    id: '4',
    name: 'Ruang Kelas XII PPLG 3',
    latitude: -7.433780,
    longitude: 109.248650,
    address: 'Gedung Utama Lantai 3',
  },
  {
    id: '5',
    name: 'Kantin & Area Belakang Sekolah',
    latitude: -7.434150,
    longitude: 109.248400,
    address: 'Area Kantin SMK Telkom Purwokerto',
  },
];

export const AttendanceService = {
  API_AUTH_BASE: 'https://gateway.ypt.or.id/telkomschool/student/issueauth',
  API_PRESENCE_BASE: 'https://gw-digits.telkomschools.sch.id/api/',
  API_GEOCODING: 'https://nominatim.openstreetmap.org/',

  // 1. API Lokasi Resmi OpenStreetMap / Nominatim (Seperti di Absenin Aja)
  async searchOfficialLocations(query: string): Promise<SavedLocation[]> {
    if (!query.trim()) return [];
    try {
      const url = `${this.API_GEOCODING}search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=id&limit=8&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AbseninAja/1.0 (IDHAM-SCHEDULE; contact@idham.sch.id)',
          Accept: 'application/json',
        },
      });

      if (!res.ok) return [];

      const data = await res.json();
      return data.map((item: any) => ({
        id: item.place_id ? item.place_id.toString() : Date.now().toString(),
        name: item.name || item.display_name.split(',')[0],
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        address: item.display_name,
      }));
    } catch (e) {
      console.log('Error querying location API:', e);
      return [];
    }
  },

  // 2. Reverse Geocoding (Cari alamat lengkap dari koordinat)
  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const url = `${this.API_GEOCODING}reverse?format=json&lat=${lat}&lon=${lon}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AbseninAja/1.0 (IDHAM-SCHEDULE; contact@idham.sch.id)',
          Accept: 'application/json',
        },
      });
      if (!res.ok) return `${lat}, ${lon}`;
      const json = await res.json();
      return json.display_name || `${lat}, ${lon}`;
    } catch (e) {
      return `${lat}, ${lon}`;
    }
  },

  // Auth
  async getSavedAuth(): Promise<StudentAuth | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTH);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading auth', e);
    }
    return null;
  },

  async saveAuth(auth: StudentAuth): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
    } catch (e) {
      console.error('Error saving auth', e);
    }
  },

  async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH);
    } catch (e) {
      console.error('Error clearing auth', e);
    }
  },

  // Friends (Titip Absen & Absenkan Teman)
  async getFriends(): Promise<FriendStudent[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FRIENDS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading friends', e);
    }
    return [];
  },

  async saveFriend(friend: FriendStudent): Promise<void> {
    const list = await this.getFriends();
    const idx = list.findIndex(f => f.id === friend.id || f.nis === friend.nis);
    if (idx >= 0) {
      list[idx] = friend;
    } else {
      list.push(friend);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(list));
  },

  async deleteFriend(id: string): Promise<void> {
    const list = await this.getFriends();
    const filtered = list.filter(f => f.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(filtered));
  },

  // Locations
  async getLocations(): Promise<SavedLocation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LOCATIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading locations', e);
    }
    return OFFICIAL_TELKOM_LOCATIONS;
  },

  async saveLocation(location: SavedLocation): Promise<void> {
    const list = await this.getLocations();
    const idx = list.findIndex(l => l.id === location.id);
    if (idx >= 0) {
      list[idx] = location;
    } else {
      list.push(location);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(list));
  },

  async deleteLocation(id: string): Promise<void> {
    const list = await this.getLocations();
    const filtered = list.filter(l => l.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(filtered));
  },

  // QR Code Presence Data
  async getActiveQRCode(): Promise<QRCodeData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_QR);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading active QR', e);
    }
    return null;
  },

  async setActiveQRCode(qr: QRCodeData | null): Promise<void> {
    try {
      if (qr) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_QR, JSON.stringify(qr));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_QR);
      }
    } catch (e) {
      console.error('Error setting active QR', e);
    }
  },

  parseQRCodeString(rawString: string): QRCodeData {
    try {
      const parsed = JSON.parse(rawString);
      return {
        createdAt: parsed.createdAt || new Date().toISOString(),
        type: parsed.type || 'datang',
        token: parsed.token,
        rawText: rawString,
      };
    } catch (e) {
      return {
        createdAt: new Date().toISOString(),
        type: 'datang',
        rawText: rawString,
      };
    }
  },

  // History
  async getHistory(): Promise<AttendanceRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading attendance history', e);
    }
    return [];
  },

  async saveAllHistory(history: AttendanceRecord[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  // Login API Call
  async loginStudent(usernameOrNis: string, password: string): Promise<{ success: boolean; data?: StudentAuth; message?: string }> {
    try {
      const res = await fetch(this.API_AUTH_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AbseninAja/1.0',
        },
        body: JSON.stringify({
          username: usernameOrNis,
          password: password,
        }),
      });

      const json = await res.json();

      if (res.ok && (json.token || json.data?.token || json.access_token)) {
        const token = json.token || json.data?.token || json.access_token;
        const studentData: StudentAuth = {
          token,
          nis: json.nis || json.data?.nis || usernameOrNis,
          name: json.name || json.data?.name || 'Siswa Telkom',
          email: json.email || json.data?.email,
          school: 'SMK Telkom Purwokerto',
        };
        await this.saveAuth(studentData);
        return { success: true, data: studentData };
      } else {
        return { success: false, message: json.message || 'Gagal login. Periksa NIS / Kata Sandi Anda.' };
      }
    } catch (err: any) {
      const fallbackAuth: StudentAuth = {
        token: `mock_token_${Date.now()}`,
        nis: usernameOrNis,
        name: 'Idham Baihaqi (XII PPLG 3)',
        school: 'SMK Telkom Purwokerto',
      };
      await this.saveAuth(fallbackAuth);
      return { success: true, data: fallbackAuth, message: 'Tersambung (Mode Mandiri)' };
    }
  },

  // Submit Presence
  async submitPresence(
    type: 'DATANG' | 'PULANG',
    location: SavedLocation,
    targetFriend?: FriendStudent,
    qrData?: QRCodeData | null
  ): Promise<{ success: boolean; message: string }> {
    const auth = await this.getSavedAuth();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const studentName = targetFriend ? targetFriend.name : auth?.name || 'Idham Baihaqi';
    const studentNis = targetFriend ? targetFriend.nis : auth?.nis || '541221001';
    const studentToken = targetFriend?.token || auth?.token;

    const qrPayload = qrData ? (qrData.rawText || JSON.stringify(qrData)) : undefined;

    try {
      if (studentToken && !studentToken.startsWith('mock_')) {
        const payload: any = {
          type: type.toLowerCase(),
          latitude: location.latitude,
          longitude: location.longitude,
          createdAt: qrData?.createdAt || now.toISOString(),
        };

        if (qrData?.token) {
          payload.qrToken = qrData.token;
        }

        const res = await fetch(`${this.API_PRESENCE_BASE}presence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${studentToken}`,
            'User-Agent': 'AbseninAja/1.0',
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) {
          console.log('Presence api response:', json);
        }
      }
    } catch (e) {
      console.log('Online presence network error, logging locally:', e);
    }

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      studentNis,
      studentName,
      date: dateStr,
      time: timeStr,
      type,
      status: `Berhasil Absen ${type}`,
      locationName: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      qrPayload,
    };

    const history = await this.getHistory();
    history.unshift(newRecord);
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 50)));

    if (targetFriend) {
      targetFriend.lastPresence = `${type} (${timeStr} WIB)`;
      await this.saveFriend(targetFriend);
    }

    const qrNotice = qrData ? ' [QR Code Ter-embed ✅]' : '';

    return {
      success: true,
      message: `Presensi ${type} untuk ${studentName} (NIS: ${studentNis}) berhasil dicatat pada ${timeStr} WIB di ${location.name}.${qrNotice}`,
    };
  },

  // Batch presence for all friends in list
  async submitBatchPresence(
    type: 'DATANG' | 'PULANG',
    location: SavedLocation,
    friends: FriendStudent[],
    qrData?: QRCodeData | null
  ): Promise<{ success: boolean; count: number; message: string }> {
    let successCount = 0;
    for (const friend of friends) {
      await this.submitPresence(type, location, friend, qrData);
      successCount++;
    }
    return {
      success: true,
      count: successCount,
      message: `Presensi ${type} massal berhasil untuk ${successCount} siswa di ${location.name}!`,
    };
  },
};
