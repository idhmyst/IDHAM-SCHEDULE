import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, KnowledgeDocument, MeetingAgenda, ScheduleOverride, TaskAssignment, UserSettings } from '../types';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

const KEYS = {
  SETTINGS: '@idham_settings_v1',
  OVERRIDES: '@idham_overrides_v1',
  MEETINGS: '@idham_meetings_v1',
  TASKS: '@idham_tasks_v1',
  KNOWLEDGE: '@idham_knowledge_v1',
  CHATS: '@idham_chats_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Idham',
  defaultClass: 'XII PPLG 3',
  notifyBeforeMinutes: 30,
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
          .then();
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
          .then();
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

        if (isSupabaseConfigured()) {
          supabase.from('meetings').update({ is_completed: item.isCompleted }).eq('id', id).then();
        }
      }
    } catch (e) {
      console.error('Error toggling meeting', e);
    }
  },

  // Task Assignments (Tugas & File Lampiran)
  async getTasks(): Promise<TaskAssignment[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TASKS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading tasks', e);
    }
    return [];
  },

  async saveTask(task: TaskAssignment): Promise<void> {
    try {
      const existing = await this.getTasks();
      const index = existing.findIndex(t => t.id === task.id);
      if (index >= 0) {
        existing[index] = task;
      } else {
        existing.push(task);
      }
      existing.sort((a, b) => `${a.deadlineDate} ${a.deadlineTime}`.localeCompare(`${b.deadlineDate} ${b.deadlineTime}`));
      await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(existing));
    } catch (e) {
      console.error('Error saving task', e);
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      const existing = await this.getTasks();
      const filtered = existing.filter(t => t.id !== id);
      await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error deleting task', e);
    }
  },

  async toggleTaskCompleted(id: string): Promise<void> {
    try {
      const existing = await this.getTasks();
      const item = existing.find(t => t.id === id);
      if (item) {
        item.isCompleted = !item.isCompleted;
        await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(existing));
      }
    } catch (e) {
      console.error('Error toggling task', e);
    }
  },

  // Knowledge Base (Dokumen yang dipelajari bot)
  async getKnowledgeDocs(): Promise<KnowledgeDocument[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.KNOWLEDGE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading knowledge docs', e);
    }
    return [];
  },

  async saveKnowledgeDoc(doc: KnowledgeDocument): Promise<void> {
    try {
      const existing = await this.getKnowledgeDocs();
      const index = existing.findIndex(d => d.id === doc.id);
      if (index >= 0) {
        existing[index] = doc;
      } else {
        existing.unshift(doc);
      }
      await AsyncStorage.setItem(KEYS.KNOWLEDGE, JSON.stringify(existing));
    } catch (e) {
      console.error('Error saving knowledge doc', e);
    }
  },

  async deleteKnowledgeDoc(id: string): Promise<void> {
    try {
      const existing = await this.getKnowledgeDocs();
      const filtered = existing.filter(d => d.id !== id);
      await AsyncStorage.setItem(KEYS.KNOWLEDGE, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error deleting knowledge doc', e);
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
