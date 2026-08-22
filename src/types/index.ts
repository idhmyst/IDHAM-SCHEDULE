export type DayName = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';

export interface ScheduleItem {
  id: string;
  period: number;
  time: string;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  room: string;
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

export interface TaskAssignment {
  id: string;
  title: string;
  subject: string; // e.g. "Matematika (MTK-4)"
  deadlineDate: string; // YYYY-MM-DD
  deadlineTime: string; // HH:mm
  description?: string;
  attachedFileName?: string;
  attachedFileUri?: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  fileName: string;
  fileUri?: string;
  textContent: string;
  summary?: string;
  tags?: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  actionType?: 'schedule' | 'meeting' | 'override' | 'task' | 'knowledge' | 'general';
  attachedFileName?: string;
}

export interface UserSettings {
  userName: string;
  defaultClass: string;
  notifyBeforeMinutes: number;
  enableVibration: boolean;
}
