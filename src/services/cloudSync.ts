import { supabase } from './supabase';
import { StorageService } from './storage';
import { AttendanceService } from './attendanceService';
import { KnowledgeService } from './knowledgeService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  className: string;
}

const STORAGE_KEYS = {
  USER_PROFILE: '@idham_cloud_user_profile_v1',
  LAST_SYNC: '@idham_cloud_last_sync_v1',
};

export const CloudSyncService = {
  // 1. Authentication & Profile
  async getLocalProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const local = await this.getLocalProfile();
    if (local) return local;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || 'Idham Baihaqi',
          className: session.user.user_metadata?.class_name || 'XII PPLG 3',
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        return profile;
      }
    } catch (e) {}

    return null;
  },

  // 2. Real Email OTP Authentication
  async sendEmailOtp(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: `Kode OTP verifikasi telah dikirim ke ${email}. Silakan cek kotak masuk atau spam email Anda.`,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal mengirim OTP ke email.' };
    }
  },

  async verifyEmailOtp(
    email: string,
    token: string,
    fullName: string = 'Idham Baihaqi',
    className: string = 'XII PPLG 3'
  ): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email',
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        const finalName = data.user.user_metadata?.full_name || fullName.trim() || 'Idham Baihaqi';
        const finalClass = data.user.user_metadata?.class_name || className.trim() || 'XII PPLG 3';

        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: finalName,
          className: finalClass,
        };

        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        await this.syncFromCloud(profile.id);
        await this.syncToCloud(profile.id);

        return { success: true, user: profile };
      }

      return { success: false, message: 'Kode OTP tidak valid atau kedaluwarsa.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal memverifikasi OTP.' };
    }
  },

  // 3. Password Authentication Fallback
  async signUp(email: string, pass: string, fullName: string, className: string = 'XII PPLG 3'): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            class_name: className.trim(),
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: fullName.trim(),
          className: className.trim(),
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        await this.syncToCloud(profile.id);
        return { success: true, user: profile };
      }

      return { success: false, message: 'Gagal membuat akun.' };
    } catch (err: any) {
      const localProfile: UserProfile = {
        id: `local_${Date.now()}`,
        email: email.trim(),
        fullName: fullName.trim(),
        className: className.trim(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(localProfile));
      return { success: true, user: localProfile, message: 'Tersimpan di Profil Lokal' };
    }
  },

  async signIn(email: string, pass: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass.trim(),
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        const fullName = data.user.user_metadata?.full_name || 'Idham Baihaqi';
        const className = data.user.user_metadata?.class_name || 'XII PPLG 3';
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName,
          className,
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        await this.syncFromCloud(profile.id);
        return { success: true, user: profile };
      }

      return { success: false, message: 'Gagal login akun.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Koneksi error.' };
    }
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  },

  // 4. Cloud Data Sync (Backup & Restore)
  async syncToCloud(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const tasks = await StorageService.getTasks();
      const meetings = await StorageService.getMeetings();
      const overrides = await StorageService.getOverrides();
      const attendance = await AttendanceService.getHistory();
      const knowledge = await KnowledgeService.getAllDocuments();
      const settings = await StorageService.getSettings();

      const backupPayload = {
        user_id: userId,
        tasks_data: tasks,
        meetings_data: meetings,
        overrides_data: overrides,
        attendance_data: attendance,
        knowledge_data: knowledge,
        settings_data: settings,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_backups')
        .upsert(backupPayload, { onConflict: 'user_id' });

      if (error) {
        console.log('Cloud sync error:', error);
        return { success: false, message: error.message };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      return { success: true, message: 'Data berhasil disinkronkan ke Supabase Cloud!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal sinkron data.' };
    }
  },

  async syncFromCloud(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_backups')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, message: error.message };
      }

      if (data) {
        if (data.tasks_data) await StorageService.saveAllTasks(data.tasks_data);
        if (data.meetings_data) await StorageService.saveAllMeetings(data.meetings_data);
        if (data.overrides_data) await StorageService.saveAllOverrides(data.overrides_data);
        if (data.attendance_data) await AttendanceService.saveAllHistory(data.attendance_data);
        if (data.settings_data) await StorageService.saveSettings(data.settings_data);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        return { success: true, message: 'Data berhasil dipulihkan dari Supabase Cloud!' };
      }

      return { success: true, message: 'Belum ada backup cloud sebelumnya.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal restore data.' };
    }
  },

  async getLastSyncTime(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  },
};
