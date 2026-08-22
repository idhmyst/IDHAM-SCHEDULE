import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DayName, DaySchedule, MeetingAgenda, ScheduleItem, TaskAssignment } from '../types';
import { ScheduleService } from './scheduleService';
import { StorageService } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const DAY_INDEX_MAP: { [key in DayName]: number } = {
  minggu: 1,
  senin: 2,
  selasa: 3,
  rabu: 4,
  kamis: 5,
  jumat: 6,
  sabtu: 7,
};

export const getReminderLabel = (minutes: number): string => {
  if (minutes <= 0) return 'Nonaktif';
  if (minutes < 60) return `${minutes} menit lagi`;
  if (minutes === 60) return '1 jam lagi';
  if (minutes < 1440) return `${Math.round(minutes / 60)} jam lagi`;
  if (minutes === 1440) return '1 hari lagi (H-1)';
  if (minutes === 10080) return '1 minggu lagi (H-7)';
  if (minutes >= 43200) return '1 bulan lagi (H-30)';
  return `${Math.round(minutes / 1440)} hari lagi`;
};

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('schedule-reminders', {
        name: 'Pengingat Jadwal & Mapel',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#D90000',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        bypassDnd: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Pengingat Deadline Tugas & File',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#D90000',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        bypassDnd: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    return true;
  },

  async scheduleAllReminders(): Promise<void> {
    if (Platform.OS === 'web') return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const settings = await StorageService.getSettings();
    const minutesBefore = settings.notifyBeforeMinutes;

    if (minutesBefore <= 0) return;

    const currentClass = settings.defaultClass || 'XII PPLG 3';
    const days: DayName[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
    const reminderText = getReminderLabel(minutesBefore);

    // 1. Schedule Weekly Class Reminders
    for (const day of days) {
      const daySchedule = await ScheduleService.getScheduleForDay(currentClass, day);
      if (!daySchedule || !daySchedule.items) continue;

      for (const item of daySchedule.items) {
        if (item.subjectCode === '5R') continue;

        const [startH, startM] = item.startTime.split(':').map(Number);
        if (isNaN(startH) || isNaN(startM)) continue;

        let targetMinute = startM - (minutesBefore % 60);
        let targetHour = startH - Math.floor(minutesBefore / 60);

        while (targetMinute < 0) {
          targetMinute += 60;
          targetHour -= 1;
        }

        if (targetHour < 0) continue;

        const weekday = DAY_INDEX_MAP[day];

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🔔 Mapel Berikutnya: ${item.subjectCode} (${item.subjectName})`,
              body: `Mulai ${reminderText} (${item.startTime} WIB) di Ruang ${item.room}. Jangan terlambat!`,
              sound: 'default',
              vibrate: [0, 500, 250, 500],
              data: { type: 'schedule', itemId: item.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday,
              hour: targetHour,
              minute: targetMinute,
            },
          });
        } catch (e) {
          console.log(`Failed to schedule reminder for ${item.subjectCode}:`, e);
        }
      }
    }

    // 2. Schedule Meetings Reminders
    const meetings = await StorageService.getMeetings();
    const now = new Date();

    for (const meeting of meetings) {
      if (meeting.isCompleted) continue;

      const [mYear, mMonth, mDay] = meeting.date.split('-').map(Number);
      const [mH, mM] = meeting.time.split(':').map(Number);

      if (isNaN(mYear) || isNaN(mMonth) || isNaN(mDay) || isNaN(mH) || isNaN(mM)) continue;

      const meetingDate = new Date(mYear, mMonth - 1, mDay, mH, mM);
      const triggerDate = new Date(meetingDate.getTime() - minutesBefore * 60 * 1000);

      if (triggerDate > now) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `📌 Agenda Meeting: ${meeting.title}`,
              body: `Mulai ${reminderText} (${meeting.time} WIB) di ${meeting.location}.`,
              sound: 'default',
              vibrate: [0, 500, 250, 500],
              data: { type: 'meeting', meetingId: meeting.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
            },
          });
        } catch (e) {
          console.log(`Failed to schedule meeting ${meeting.title}:`, e);
        }
      }
    }

    // 3. Schedule Task / Assignment Deadlines Reminders
    const tasks = await StorageService.getTasks();
    for (const task of tasks) {
      if (task.isCompleted) continue;

      const [tYear, tMonth, tDay] = task.deadlineDate.split('-').map(Number);
      const [tH, tM] = task.deadlineTime.split(':').map(Number);

      if (isNaN(tYear) || isNaN(tMonth) || isNaN(tDay) || isNaN(tH) || isNaN(tM)) continue;

      const deadlineDate = new Date(tYear, tMonth - 1, tDay, tH, tM);
      const triggerDate = new Date(deadlineDate.getTime() - minutesBefore * 60 * 1000);

      if (triggerDate > now) {
        const fileStatus = task.attachedFileName
          ? `(File lampiran: ${task.attachedFileName} sudah siap)`
          : `(Segera kumpulkan file tugas!)`;

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `⚠️ Deadline Tugas: ${task.title} [${task.subject}]`,
              body: `Batas pengumpulan ${reminderText} (${task.deadlineTime} WIB). ${fileStatus}`,
              sound: 'default',
              vibrate: [0, 500, 250, 500],
              data: { type: 'task', taskId: task.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
            },
          });
        } catch (e) {
          console.log(`Failed to schedule task reminder ${task.title}:`, e);
        }
      }
    }
  },

  async sendInstantTestNotification(): Promise<void> {
    if (Platform.OS === 'web') {
      alert('🔔 [TEST NOTIFIKASI] Pengingat berbunyi! Alarm notifikasi aktif.');
      return;
    }

    await this.requestPermissions();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Pengingat IDHAM SCHEDULE',
        body: 'Notifikasi bersuara & getar berhasil diuji! Anda akan diingatkan tepat waktu.',
        sound: 'default',
        vibrate: [0, 500, 250, 500],
      },
      trigger: null,
    });
  },
};
