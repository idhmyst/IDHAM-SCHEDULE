export type DayName = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';

export interface ScheduleItem {
  id: string;
  period: number; // 0 for Tadarus/Apel, 1..11 for class periods
  time: string; // e.g. "07.40 - 08.20"
  startTime: string; // "07:40"
  endTime: string; // "08:20"
  subjectCode: string; // "MTK-4", "PAI-3", etc.
  subjectName: string; // "Matematika", "Pendidikan Agama Islam", etc.
  room: string; // "B.3.2", "A.2.6", "D.1.2", etc.
  description?: string;
  isBreak?: boolean;
}

export interface DaySchedule {
  day: DayName;
  dayLabel: string;
  uniform: string;
  items: ScheduleItem[];
}

export interface ClassScheduleMap {
  [className: string]: {
    [day in DayName]?: DaySchedule;
  };
}

export interface ScheduleOverride {
  id: string;
  className: string;
  day: DayName;
  period: number;
  newSubjectCode?: string;
  newSubjectName?: string;
  newRoom?: string;
  note?: string;
  createdAt: string;
}

export interface MeetingAgenda {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  actionType?: 'schedule' | 'meeting' | 'override' | 'general';
}

export interface UserSettings {
  userName: string;
  defaultClass: string;
  notifyBeforeMinutes: number;
  enableVibration: boolean;
}
