import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DayName, DaySchedule, MeetingAgenda, ScheduleItem } from '../types';
import { ScheduleService } from './scheduleService';
import { StorageService } from './storage';

// Configure notification behavior
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
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D90000',
        sound: 'default',
      });
    }

    return true;
  },

  async scheduleAllReminders(): Promise<void> {
    if (Platform.OS === 'web') return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Cancel all existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    const settings = await StorageService.getSettings();
    const minutesBefore = settings.notifyBeforeMinutes;

    // If disabled (0 minutes), do not schedule
    if (minutesBefore <= 0) return;

    const currentClass = settings.defaultClass || 'XII PPLG 3';
    const days: DayName[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];

    // 1. Schedule Weekly Class Reminders
    for (const day of days) {
      const daySchedule = await ScheduleService.getScheduleForDay(currentClass, day);
      if (!daySchedule || !daySchedule.items) continue;

      for (const item of daySchedule.items) {
        if (item.subjectCode === '5R') continue;

        const [startH, startM] = item.startTime.split(':').map(Number);
        if (isNaN(startH) || isNaN(startM)) continue;

        let targetMinute = startM - minutesBefore;
        let targetHour = startH;

        if (targetMinute < 0) {
          targetMinute += 60;
          targetHour -= 1;
        }

        if (targetHour < 0) continue;

        const weekday = DAY_INDEX_MAP[day];
        const reminderText =
          minutesBefore >= 60
            ? `1 jam lagi (${item.startTime} WIB)`
            : `${minutesBefore} menit lagi (${item.startTime} WIB)`;

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🔔 Mapel Berikutnya: ${item.subjectCode} (${item.subjectName})`,
              body: `Mulai ${reminderText} di Ruang ${item.room}. Jangan sampai terlambat!`,
              sound: true,
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
        const reminderText =
          minutesBefore >= 60
            ? `1 jam lagi (${meeting.time} WIB)`
            : `${minutesBefore} menit lagi (${meeting.time} WIB)`;

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `📌 Agenda Meeting: ${meeting.title}`,
              body: `Mulai ${reminderText} di ${meeting.location}.`,
              sound: true,
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
  },

  async sendInstantTestNotification(): Promise<void> {
    if (Platform.OS === 'web') {
      alert('🔔 [TEST NOTIFIKASI] Pengingat jadwal aktif: 30 menit sebelum pelajaran dimulai!');
      return;
    }

    await this.requestPermissions();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Pengingat IDHAM SCHEDULE',
        body: 'Notifikasi berhasil diuji! Anda akan diingatkan sebelum waktu pelajaran/meeting dimulai.',
        sound: true,
      },
      trigger: null, // trigger immediately
    });
  },
};
