import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, MeetingAgenda, ScheduleOverride, UserSettings } from '../types';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

const KEYS = {
  SETTINGS: '@idham_settings_v1',
  OVERRIDES: '@idham_overrides_v1',
  MEETINGS: '@idham_meetings_v1',
  CHATS: '@idham_chats_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Idham',
  defaultClass: 'XII PPLG 3',
  notifyBeforeMinutes: 15,
  enableVibration: true,
};

const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_ANON_KEY && SUPABASE_URL);
};

export const StorageService = {
  // Settings
  async getSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading settings', e);
    }
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  },

  // Overrides
  async getOverrides(): Promise<ScheduleOverride[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.OVERRIDES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading overrides', e);
    }
    return [];
  },

  async saveOverride(override: ScheduleOverride): Promise<void> {
    try {
      const existing = await this.getOverrides();
      const filtered = existing.filter(
        o => !(o.day === override.day && o.period === override.period && o.className === override.className)
      );
      filtered.push(override);
      await AsyncStorage.setItem(KEYS.OVERRIDES, JSON.stringify(filtered));

      // Background Sync to Supabase if connected
      if (isSupabaseConfigured()) {
        supabase
          .from('schedule_overrides')
          .upsert({
            id: override.id,
            class_name: override.className,
            day: override.day,
            period: override.period,
            new_subject_code: override.newSubjectCode,
            new_subject_name: override.newSubjectName,
            new_room: override.newRoom,
            note: override.note,
          })
          .then(({ error }) => {
            if (error) console.log('Supabase sync override note:', error.message);
          });
      }
    } catch (e) {
      console.error('Error saving override', e);
    }
  },

  async deleteOverride(id: string): Promise<void> {
    try {
      const existing = await this.getOverrides();
      const filtered = existing.filter(o => o.id !== id);
      await AsyncStorage.setItem(KEYS.OVERRIDES, JSON.stringify(filtered));

      // Background Delete from Supabase
      if (isSupabaseConfigured()) {
        supabase.from('schedule_overrides').delete().eq('id', id).then();
      }
    } catch (e) {
      console.error('Error deleting override', e);
    }
  },

  // Meetings & Agenda
  async getMeetings(): Promise<MeetingAgenda[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MEETINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading meetings', e);
    }
    return [];
  },

  async saveMeeting(meeting: MeetingAgenda): Promise<void> {
    try {
      const existing = await this.getMeetings();
      const index = existing.findIndex(m => m.id === meeting.id);
      if (index >= 0) {
        existing[index] = meeting;
      } else {
        existing.push(meeting);
      }
      existing.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      await AsyncStorage.setItem(KEYS.MEETINGS, JSON.stringify(existing));

      // Background Sync to Supabase if connected
      if (isSupabaseConfigured()) {
        supabase
          .from('meetings')
          .upsert({
            id: meeting.id,
            title: meeting.title,
            date: meeting.date,
            time: meeting.time,
            location: meeting.location,
            notes: meeting.notes,
            is_completed: meeting.isCompleted,
          })
          .then(({ error }) => {
            if (error) console.log('Supabase sync meeting error:', error.message);
          });
      }
    } catch (e) {
      console.error('Error saving meeting', e);
    }
  },

  async deleteMeeting(id: string): Promise<void> {
    try {
      const existing = await this.getMeetings();
      const filtered = existing.filter(m => m.id !== id);
      await AsyncStorage.setItem(KEYS.MEETINGS, JSON.stringify(filtered));

      // Background Delete from Supabase
      if (isSupabaseConfigured()) {
        supabase.from('meetings').delete().eq('id', id).then();
      }
    } catch (e) {
      console.error('Error deleting meeting', e);
    }
  },

  async toggleMeetingCompleted(id: string): Promise<void> {
    try {
      const existing = await this.getMeetings();
      const item = existing.find(m => m.id === id);
      if (item) {
        item.isCompleted = !item.isCompleted;
        await AsyncStorage.setItem(KEYS.MEETINGS, JSON.stringify(existing));

        // Sync state to Supabase
        if (isSupabaseConfigured()) {
          supabase
            .from('meetings')
            .update({ is_completed: item.isCompleted })
            .eq('id', id)
            .then();
        }
      }
    } catch (e) {
      console.error('Error toggling meeting', e);
    }
  },

  // Chat History
  async getChats(): Promise<ChatMessage[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHATS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading chats', e);
    }
    return [];
  },

  async saveChats(chats: ChatMessage[]): Promise<void> {
    try {
      const sliced = chats.slice(-100);
      await AsyncStorage.setItem(KEYS.CHATS, JSON.stringify(sliced));
    } catch (e) {
      console.error('Error saving chats', e);
    }
  },

  async clearChats(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.CHATS);
    } catch (e) {
      console.error('Error clearing chats', e);
    }
  },
};
