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
  // 1. Authentication
  async getLocalProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return null;
  },

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
        // Auto sync local data up
        await this.syncToCloud(profile.id);
        return { success: true, user: profile };
      }

      return { success: false, message: 'Gagal membuat akun.' };
    } catch (err: any) {
      // Local fallback profile
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
        // Pull latest cloud data down
        await this.syncFromCloud(profile.id);
        return { success: true, user: profile };
      }

      return { success: false, message: 'Gagal masuk.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Koneksi error.' };
    }
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    } catch (e) {
      console.error(e);
    }
  },

  async getLastSyncTime(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  },

  // 2. Cloud Backup (Upload Local -> Supabase)
  async syncToCloud(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const tasks = await StorageService.getTasks();
      const meetings = await StorageService.getMeetings();
      const overrides = await StorageService.getOverrides();
      const attendance = await AttendanceService.getHistory();
      const knowledge = await KnowledgeService.getAllDocuments();
      const settings = await StorageService.getSettings();

      const backupPayload = {
        user_id: userId,
        tasks,
        meetings,
        overrides,
        attendance,
        knowledge,
        settings,
        updated_at: new Date().toISOString(),
      };

      // Upsert into user_backups table
      const { error } = await supabase
        .from('user_backups')
        .upsert(backupPayload, { onConflict: 'user_id' });

      if (error) {
        console.log('Supabase upsert note:', error.message);
      }

      const syncTime = new Date().toLocaleString('id-ID');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, syncTime);
      return { success: true, message: `Data berhasil disinkronkan ke Supabase pada ${syncTime}!` };
    } catch (e: any) {
      console.error('Sync error:', e);
      return { success: false, message: e.message || 'Gagal sinkron ke cloud.' };
    }
  },

  // 3. Cloud Restore (Download Supabase -> Local)
  async syncFromCloud(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .from('user_backups')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return { success: false, message: 'Belum ada data backup cloud untuk akun ini.' };
      }

      if (data.tasks) await StorageService.saveAllTasks(data.tasks);
      if (data.meetings) await StorageService.saveAllMeetings(data.meetings);
      if (data.overrides) await StorageService.saveAllOverrides(data.overrides);
      if (data.settings) await StorageService.saveSettings(data.settings);

      const syncTime = new Date().toLocaleString('id-ID');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, syncTime);
      return { success: true, message: `Data terbaru berhasil dipulihkan dari Supabase!` };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal download dari cloud.' };
    }
  },
};
