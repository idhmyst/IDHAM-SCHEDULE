import { DayName } from '../types';

export interface ParsedQuery {
  intent:
    | 'GREETING'
    | 'ASK_SCHEDULE_TODAY'
    | 'ASK_SCHEDULE_TOMORROW'
    | 'ASK_SCHEDULE_DAY'
    | 'ASK_CURRENT_ROOM'
    | 'ASK_UNIFORM'
    | 'ADD_MEETING'
    | 'LIST_MEETINGS'
    | 'OVERRIDE_SCHEDULE'
    | 'SEARCH_SUBJECT'
    | 'CLEAR_CHAT'
    | 'HELP'
    | 'UNKNOWN';
  targetDay?: DayName;
  targetSubject?: string;
  meetingDetails?: {
    title: string;
    date: string;
    time: string;
    location: string;
  };
  overrideDetails?: {
    day?: DayName;
    period?: number;
    newSubject?: string;
    newRoom?: string;
  };
}

export function parseUserQuery(input: string): ParsedQuery {
  const clean = input.trim().toLowerCase();

  // 1. Greetings
  if (/^(halo|hai|hi|hey|assalamualaikum|pagi|siang|sore|malam|bot|oy|oi)\b/i.test(clean) && clean.length < 25) {
    return { intent: 'GREETING' };
  }

  // 2. Help
  if (/\b(bantuan|help|menu|bisa apa|fitur|cara pakai|panduan)\b/i.test(clean)) {
    return { intent: 'HELP' };
  }

  // 3. Clear Chat
  if (/\b(hapus chat|clear chat|bersihkan riwayat|reset percakapan)\b/i.test(clean)) {
    return { intent: 'CLEAR_CHAT' };
  }

  // 4. Current Room / Subject Right Now
  if (
    /\b(ruang(an)? sekarang|sekarang di mana|mapel sekarang|jam ini apa|sekarang belajar apa|kelas sekarang)\b/i.test(clean) ||
    (/\bsekarang\b/i.test(clean) && /\b(ruang|mapel|kelas|pelajaran)\b/i.test(clean))
  ) {
    return { intent: 'ASK_CURRENT_ROOM' };
  }

  // 5. Uniforms
  if (/\b(seragam|baju|pakaian|dresscode|kostum)\b/i.test(clean)) {
    let day: DayName | undefined;
    if (/\bbesok\b/i.test(clean)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const days: DayName[] = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
      day = days[tomorrow.getDay()];
    } else {
      const days: DayName[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
      for (const d of days) {
        if (clean.includes(d)) {
          day = d;
          break;
        }
      }
    }
    return { intent: 'ASK_UNIFORM', targetDay: day };
  }

  // 6. Add Meeting / Appointment
  // Examples: "ingatkan meeting osis besok jam 14.00 di aula", "tambah meeting projek hari rabu jam 10:00 di sentra"
  if (/\b(tambah|buat|ingatkan|jadwalkan|catat)\b.*\b(meeting|janji|agenda|rapat|temu|diskusi)\b/i.test(clean) ||
      /\b(meeting|janji|agenda|rapat)\b.*\b(jam|pukul)\b/i.test(clean)) {
    
    // Extract time (e.g. 14:00, 14.00, jam 2, pukul 10)
    let time = '09:00';
    const timeMatch = clean.match(/(?:jam|pukul)?\s*(\d{1,2})[.:](\d{2})/i) || clean.match(/(?:jam|pukul)\s*(\d{1,2})/i);
    if (timeMatch) {
      if (timeMatch[2]) {
        time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
      } else {
        time = `${timeMatch[1].padStart(2, '0')}:00`;
      }
    }

    // Extract date/day
    let dateStr = new Date().toISOString().split('T')[0];
    if (/\bbesok\b/i.test(clean)) {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      dateStr = tom.toISOString().split('T')[0];
    } else if (/\blusa\b/i.test(clean)) {
      const lusa = new Date();
      lusa.setDate(lusa.getDate() + 2);
      dateStr = lusa.toISOString().split('T')[0];
    }

    // Extract location
    let location = 'Sekolah';
    const locMatch = clean.match(/\bdi\s+([a-zA-Z0-9.\s]+?)(?:\s+(?:jam|pukul|pada|tanggal)|$)/i);
    if (locMatch) {
      location = locMatch[1].trim();
    }

    // Extract title
    let title = 'Meeting / Agenda';
    const titleMatch = clean.match(/(?:meeting|janji|agenda|rapat|temu)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:besok|lusa|hari|jam|pukul|di)|$)/i);
    if (titleMatch && titleMatch[1]) {
      title = `Meeting ${titleMatch[1].trim()}`;
    }

    return {
      intent: 'ADD_MEETING',
      meetingDetails: {
        title,
        date: dateStr,
        time,
        location,
      },
    };
  }

  // 7. List Meetings / Agendas
  if (/\b(daftar meeting|jadwal meeting|agenda saya|ada meeting apa|cek meeting|rapat apa|jadwal janji)\b/i.test(clean)) {
    return { intent: 'LIST_MEETINGS' };
  }

  // 8. Override / Change Schedule
  if (/\b(ubah|ganti|update|override|revisi)\b.*\b(jadwal|ruangan|mapel|jam)\b/i.test(clean)) {
    let day: DayName = 'senin';
    const days: DayName[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
    for (const d of days) {
      if (clean.includes(d)) {
        day = d;
        break;
      }
    }

    let period = 1;
    const periodMatch = clean.match(/jam(?:\s+ke)?\s*(\d{1,2})/i);
    if (periodMatch) {
      period = parseInt(periodMatch[1], 10);
    }

    return {
      intent: 'OVERRIDE_SCHEDULE',
      overrideDetails: {
        day,
        period,
      },
    };
  }

  // 9. Ask Schedule: Tomorrow
  if (/\b(jadwal besok|besok mapel apa|besok belajar apa|besok ada apa|pelajaran besok)\b/i.test(clean) ||
      (/\bbesok\b/i.test(clean) && /\b(jadwal|mapel|pelajaran|ruang)\b/i.test(clean))) {
    return { intent: 'ASK_SCHEDULE_TOMORROW' };
  }

  // 10. Ask Schedule: Specific Day (Senin..Jumat)
  const daysMap: { [k: string]: DayName } = {
    senin: 'senin',
    selasa: 'selasa',
    rabu: 'rabu',
    kamis: 'kamis',
    jumat: 'jumat',
    "jum'at": 'jumat',
    sabtu: 'sabtu',
    minggu: 'minggu',
  };

  for (const [key, val] of Object.entries(daysMap)) {
    if (clean.includes(key)) {
      return { intent: 'ASK_SCHEDULE_DAY', targetDay: val };
    }
  }

  // 11. Ask Schedule: Today (Default when asking about schedule)
  if (/\b(jadwal hari ini|hari ini mapel apa|hari ini belajar apa|jadwal sekarang|jadwalnya apa)\b/i.test(clean) ||
      (/\bhari ini\b/i.test(clean) && /\b(jadwal|mapel|pelajaran|kelas)\b/i.test(clean)) ||
      clean === 'jadwal') {
    return { intent: 'ASK_SCHEDULE_TODAY' };
  }

  // 12. Search specific subject (e.g. "kapan mtk", "jadwal bahasa inggris")
  const knownSubjects = ['mtk', 'matematika', 'ing', 'inggris', 'ina', 'indonesia', 'pai', 'agama', 'bk', 'bjw', 'jawa', 'ppc', 'pancasila', 'mp1', 'mk1', 'mk2', 'mk3', 'mk4', 'kik'];
  for (const sub of knownSubjects) {
    if (clean.includes(sub)) {
      return { intent: 'SEARCH_SUBJECT', targetSubject: sub };
    }
  }

  return { intent: 'UNKNOWN' };
}
