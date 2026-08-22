import { DayName, DaySchedule, ScheduleItem } from '../types';
import { MASTER_CLASSES, UNIFORMS } from '../data/masterSchedule';
import { StorageService } from './storage';

export const ScheduleService = {
  getDayKeyFromDate(date: Date): DayName {
    const days: DayName[] = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    return days[date.getDay()];
  },

  getDayLabel(day: DayName): string {
    const labels: { [k in DayName]: string } = {
      senin: 'Senin',
      selasa: 'Selasa',
      rabu: 'Rabu',
      kamis: 'Kamis',
      jumat: 'Jumat',
      sabtu: 'Sabtu',
      minggu: 'Minggu',
    };
    return labels[day] || day;
  },

  async getScheduleForDay(className: string, day: DayName): Promise<DaySchedule | null> {
    const classSchedule = MASTER_CLASSES[className] || MASTER_CLASSES['XII PPLG 3'];
    const baseDaySchedule = classSchedule[day];

    if (!baseDaySchedule) {
      return {
        day,
        dayLabel: this.getDayLabel(day),
        uniform: UNIFORMS[day] || 'Pakaian Bebas / Libur',
        items: [],
      };
    }

    // Apply any overrides saved in local storage
    const overrides = await StorageService.getOverrides();
    const classOverrides = overrides.filter(o => o.className === className && o.day === day);

    const mergedItems: ScheduleItem[] = baseDaySchedule.items.map(item => {
      const matchOverride = classOverrides.find(o => o.period === item.period);
      if (matchOverride) {
        return {
          ...item,
          subjectCode: matchOverride.newSubjectCode || item.subjectCode,
          subjectName: matchOverride.newSubjectName || item.subjectName,
          room: matchOverride.newRoom || item.room,
          description: matchOverride.note ? `[Diubah: ${matchOverride.note}]` : item.description,
        };
      }
      return item;
    });

    return {
      ...baseDaySchedule,
      items: mergedItems,
    };
  },

  async getCurrentOrNextClass(className: string): Promise<{ current: ScheduleItem | null; next: ScheduleItem | null; day: DayName }> {
    const now = new Date();
    const today = this.getDayKeyFromDate(now);
    const daySchedule = await this.getScheduleForDay(className, today);

    if (!daySchedule || daySchedule.items.length === 0) {
      return { current: null, next: null, day: today };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentItem: ScheduleItem | null = null;
    let nextItem: ScheduleItem | null = null;

    for (let i = 0; i < daySchedule.items.length; i++) {
      const item = daySchedule.items[i];
      const [startH, startM] = item.startTime.split(':').map(Number);
      const [endH, endM] = item.endTime.split(':').map(Number);

      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (currentMinutes >= startTotal && currentMinutes < endTotal) {
        currentItem = item;
        nextItem = daySchedule.items[i + 1] || null;
        break;
      } else if (currentMinutes < startTotal && !nextItem) {
        nextItem = item;
      }
    }

    return { current: currentItem, next: nextItem, day: today };
  },
};
