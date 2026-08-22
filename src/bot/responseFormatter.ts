import { DayName, DaySchedule, MeetingAgenda, TaskAssignment } from '../types';
import { ScheduleService } from '../services/scheduleService';
import { StorageService } from '../services/storage';
import { KnowledgeService } from '../services/knowledgeService';
import { NotificationService } from '../services/notificationService';
import { UNIFORMS } from '../data/masterSchedule';
import { parseUserQuery, ParsedQuery } from './nlpEngine';

export interface BotResponseResult {
  text: string;
  quickReplies?: string[];
  actionType?: 'schedule' | 'meeting' | 'override' | 'task' | 'knowledge' | 'general';
  openModal?: 'meeting' | 'override' | 'task' | 'knowledge';
  modalData?: any;
}

export async function generateBotResponse(userInput: string, currentClass: string): Promise<BotResponseResult> {
  // First, check if the question matches any learned document in Knowledge Base!
  const knowledgeMatch = await KnowledgeService.searchKnowledge(userInput);
  if (knowledgeMatch && userInput.length > 5 && !['jadwal', 'tugas', 'meeting', 'seragam'].includes(userInput.toLowerCase().trim())) {
    return {
      text: `📚 **Berdasarkan Dokumen Terpelajari [${knowledgeMatch.doc.title}]:**\n\n${knowledgeMatch.snippet}\n\n*File Sumber: ${knowledgeMatch.doc.fileName}*`,
      quickReplies: ['📂 Buka Dokumen Lain', '📅 Jadwal Hari Ini', '📝 Daftar Tugas'],
      actionType: 'knowledge',
    };
  }

  const parsed = parseUserQuery(userInput);
  const now = new Date();

  switch (parsed.intent) {
    case 'GREETING': {
      return {
        text: `Halo Idham! 👋 Ada yang bisa saya bantu untuk jadwal kelas **${currentClass}**, tugas sekolah, atau agenda meeting hari ini?`,
        quickReplies: ['📅 Jadwal Hari Ini', '📝 Daftar Tugas', '📍 Ruangan Sekarang', '📎 Upload File Belajar'],
        actionType: 'general',
      };
    }

    case 'HELP': {
      return {
        text: `🤖 **Panduan Perintah IDHAM SCHEDULE Bot:**\n\n` +
          `• 📅 **Tanya Jadwal:** *"Jadwal hari ini"*, *"Jadwal besok"*, *"Jadwal hari Rabu"*\n` +
          `• 📍 **Tanya Ruangan:** *"Ruangan sekarang"*, *"Sekarang di mana?"*\n` +
          `• 📝 **Tugas & Deadline:** *"Daftar tugas"*, *"Ingatkan tugas MTK besok jam 23.59"*\n` +
          `• 📎 **Belajar Dokumen Baru:** *"Upload file"*, *"Belajar file"* (Kirim dokumen catatan/materi)\n` +
          `• 📌 **Janji Meeting:** *"Ingatkan meeting OSIS besok jam 14.00 di Sentra"*\n` +
          `• 👕 **Tanya Seragam:** *"Seragam besok apa?"*, *"Pakaian hari Kamis"*\n` +
          `• ✏️ **Ubah Jadwal:** *"Ubah jadwal hari Kamis jam 3"*\n` +
          `• 🧹 **Bersihkan Obrolan:** *"Hapus chat"*`,
        quickReplies: ['📅 Jadwal Hari Ini', '📝 Daftar Tugas', '📎 Upload File Belajar'],
        actionType: 'general',
      };
    }

    case 'LEARN_DOCUMENT': {
      return {
        text: `📂 **Upload Dokumen Pembelajaran Baru:**\n\nSilakan pilih file (PDF, TXT, Catatan Tugas) agar saya bisa mempelajarinya dan menjawab pertanyaan Anda di masa mendatang!`,
        openModal: 'knowledge',
        actionType: 'knowledge',
        quickReplies: ['📎 Pilih File Dokumen', '📅 Jadwal Hari Ini'],
      };
    }

    case 'ADD_TASK': {
      if (parsed.taskDetails) {
        const newTask: TaskAssignment = {
          id: Date.now().toString(),
          title: parsed.taskDetails.title,
          subject: parsed.taskDetails.subject,
          deadlineDate: parsed.taskDetails.deadlineDate,
          deadlineTime: parsed.taskDetails.deadlineTime,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };

        return {
          text: `📝 **Ingin Mencatat Tugas Baru?**\nSilakan lengkapi judul dan lampirkan file tugas (PDF/Docx/Gambar) sebelum batas waktu:`,
          openModal: 'task',
          modalData: newTask,
          actionType: 'task',
        };
      }
      return {
        text: `Silakan isi detail tugas dan lampirkan file tugas:`,
        openModal: 'task',
        actionType: 'task',
      };
    }

    case 'LIST_TASKS': {
      const tasks = await StorageService.getTasks();
      if (tasks.length === 0) {
        return {
          text: `📝 Belum ada tugas atau PR yang tercatat. Ingin menambahkan tugas baru berserta lampiran file?`,
          quickReplies: ['➕ Tambah Tugas Baru', '📅 Jadwal Hari Ini'],
          actionType: 'task',
          openModal: 'task',
        };
      }

      let text = `📝 **Daftar Tugas & Deadline Idham:**\n\n`;
      tasks.forEach((t, idx) => {
        const status = t.isCompleted ? '✅ *[Selesai]*' : '⏳ *[Belum Selesai]*';
        const fileInfo = t.attachedFileName ? `\n   📎 File: *${t.attachedFileName}*` : '';
        text += `${idx + 1}. **${t.title}** (${t.subject}) ${status}\n` +
          `   ⏰ Deadline: **${t.deadlineDate} pukul ${t.deadlineTime} WIB**` +
          fileInfo +
          `\n\n`;
      });

      return {
        text,
        quickReplies: ['➕ Tambah Tugas Baru', '📅 Jadwal Hari Ini', '📋 Daftar Meeting'],
        actionType: 'task',
      };
    }

    case 'CLEAR_CHAT': {
      await StorageService.clearChats();
      return {
        text: `🧹 Riwayat percakapan telah dibersihkan!`,
        quickReplies: ['📅 Jadwal Hari Ini', '📍 Ruangan Sekarang'],
        actionType: 'general',
      };
    }

    case 'ASK_CURRENT_ROOM': {
      const { current, next, day } = await ScheduleService.getCurrentOrNextClass(currentClass);
      const dayLabel = ScheduleService.getDayLabel(day);

      if (!current && !next) {
        return {
          text: `ℹ️ **Status Sekarang (${dayLabel}):**\nSaat ini sedang di luar jam pelajaran sekolah. Nikmati waktu istirahatmu! 🎉`,
          quickReplies: ['📋 Jadwal Besok', '📅 Jadwal Lengkap Hari Ini', '📝 Cek Tugas'],
          actionType: 'schedule',
        };
      }

      let responseText = '';
      if (current) {
        responseText += `📍 **Sedang Berlangsung (${current.time}):**\n` +
          `• **Mata Pelajaran:** ${current.subjectName}\n` +
          `• **Kode:** ${current.subjectCode}\n` +
          `• **Ruangan:** 🏫 **${current.room}**\n` +
          `${current.description ? `• *${current.description}*\n` : ''}`;
      } else {
        responseText += `⏱️ Saat ini belum masuk jam pelajaran.`;
      }

      if (next) {
        responseText += `\n⏭️ **Mapel Berikutnya (${next.time}):**\n` +
          `• ${next.subjectName} (${next.subjectCode})\n` +
          `• Ruangan: **${next.room}**`;
      }

      return {
        text: responseText,
        quickReplies: ['📅 Jadwal Lengkap Hari Ini', '👕 Seragam Hari Ini', '📋 Jadwal Besok'],
        actionType: 'schedule',
      };
    }

    case 'ASK_SCHEDULE_TODAY': {
      const todayKey = ScheduleService.getDayKeyFromDate(now);
      return formatDayScheduleResponse(currentClass, todayKey, 'Hari Ini');
    }

    case 'ASK_SCHEDULE_TOMORROW': {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = ScheduleService.getDayKeyFromDate(tomorrow);
      return formatDayScheduleResponse(currentClass, tomorrowKey, 'Besok');
    }

    case 'ASK_SCHEDULE_DAY': {
      const targetDay = parsed.targetDay || 'senin';
      return formatDayScheduleResponse(currentClass, targetDay, ScheduleService.getDayLabel(targetDay));
    }

    case 'ASK_UNIFORM': {
      let targetDay = parsed.targetDay;
      if (!targetDay) {
        targetDay = ScheduleService.getDayKeyFromDate(now);
      }
      const dayLabel = ScheduleService.getDayLabel(targetDay);
      const uniform = UNIFORMS[targetDay] || 'Bebas Rapi';

      return {
        text: `👕 **Seragam Hari ${dayLabel}:**\n**${uniform}**\n\n*Catatan: Setiap Kamis minggu ke-3 mengenakan batik bebas. Praktik menyesuaikan instruksi guru.*`,
        quickReplies: ['📅 Jadwal Hari Ini', '📋 Jadwal Besok'],
        actionType: 'general',
      };
    }

    case 'ADD_MEETING': {
      if (parsed.meetingDetails) {
        const newMeeting: MeetingAgenda = {
          id: Date.now().toString(),
          title: parsed.meetingDetails.title,
          date: parsed.meetingDetails.date,
          time: parsed.meetingDetails.time,
          location: parsed.meetingDetails.location,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };
        await StorageService.saveMeeting(newMeeting);
        await NotificationService.scheduleAllReminders();

        return {
          text: `✅ **Janji Meeting Berhasil Dicatat!**\n\n📌 **Agenda:** ${newMeeting.title}\n📅 **Tanggal:** ${newMeeting.date}\n⏰ **Waktu:** ${newMeeting.time} WIB\n📍 **Lokasi:** ${newMeeting.location}\n\nPengingat telah aktif dan akan membunyikan alarm sebelum waktu pertemuan tiba!`,
          quickReplies: ['📋 Lihat Semua Meeting', '➕ Tambah Meeting Baru'],
          actionType: 'meeting',
        };
      } else {
        return {
          text: `Silakan lengkapi detail meeting yang ingin Anda jadwalkan:`,
          openModal: 'meeting',
          actionType: 'meeting',
        };
      }
    }

    case 'LIST_MEETINGS': {
      const meetings = await StorageService.getMeetings();
      if (meetings.length === 0) {
        return {
          text: `📋 Belum ada agenda meeting atau janji temu yang tercatat. Ingin menambahkan yang baru?`,
          quickReplies: ['➕ Tambah Meeting Baru', '📅 Jadwal Hari Ini'],
          actionType: 'meeting',
          openModal: 'meeting',
        };
      }

      let text = `📋 **Daftar Agenda & Janji Meeting Idham:**\n\n`;
      meetings.forEach((m, idx) => {
        const status = m.isCompleted ? '✅ *[Selesai]*' : '⏳ *[Mendatang]*';
        text += `${idx + 1}. **${m.title}** ${status}\n` +
          `   📅 ${m.date} | ⏰ ${m.time} WIB\n` +
          `   📍 ${m.location}\n\n`;
      });

      return {
        text,
        quickReplies: ['➕ Tambah Meeting Baru', '📅 Jadwal Hari Ini'],
        actionType: 'meeting',
      };
    }

    case 'OVERRIDE_SCHEDULE': {
      return {
        text: `✏️ Ingin mengubah mata pelajaran atau ruangan? Silakan sesuaikan form perubahan jadwal:`,
        openModal: 'override',
        modalData: parsed.overrideDetails,
        actionType: 'override',
      };
    }

    case 'SEARCH_SUBJECT': {
      const sub = parsed.targetSubject || '';
      return {
        text: `🔍 Mencari informasi mata pelajaran **"${sub.toUpperCase()}"** untuk kelas **${currentClass}**...\n\nSilakan cek jadwal harian berikut:`,
        quickReplies: ['📅 Jadwal Senin', '📅 Jadwal Selasa', '📅 Jadwal Rabu', '📅 Jadwal Kamis', '📅 Jadwal Jumat'],
        actionType: 'schedule',
      };
    }

    case 'UNKNOWN':
    default: {
      return {
        text: `Maaf Idham, saya belum menemukan jawaban di jadwal atau file yang pernah Anda unggah. 🤔\n\nAnda bisa mencoba:\n` +
          `• *"Jadwal hari ini"* atau *"Ruangan sekarang di mana?"*\n` +
          `• *"Daftar tugas"* atau *"Tambah tugas"* (beserta lampiran file)\n` +
          `• *"Upload file"* untuk memasukkan catatan/materi baru agar saya pelajari!`,
        quickReplies: ['📅 Jadwal Hari Ini', '📝 Daftar Tugas', '📎 Upload File Belajar', '❓ Bantuan'],
        actionType: 'general',
      };
    }
  }
}

async function formatDayScheduleResponse(className: string, day: DayName, label: string): Promise<BotResponseResult> {
  const schedule = await ScheduleService.getScheduleForDay(className, day);
  const dayLabel = ScheduleService.getDayLabel(day);

  if (!schedule || schedule.items.length === 0) {
    return {
      text: `🎉 **Jadwal ${label} (${dayLabel}) - Kelas ${className}:**\n\nHari ini libur / tidak ada jadwal pelajaran reguler. Waktunya istirahat atau mengulang materi! 🏖️`,
      quickReplies: ['📅 Jadwal Senin', '📅 Jadwal Selasa', '📝 Cek Tugas'],
      actionType: 'schedule',
    };
  }

  let text = `📅 **Jadwal Pelajaran ${label} (${dayLabel})**\n`;
  text += `🏫 **Kelas:** ${className}\n`;
  text += `👕 **Seragam:** ${schedule.uniform}\n\n`;

  schedule.items.forEach(item => {
    text += `⏰ **${item.time}**\n`;
    text += `   📖 **${item.subjectName}**\n`;
    text += `   📍 Ruangan: **${item.room}**\n`;
    if (item.description) {
      text += `   ℹ️ *${item.description}*\n`;
    }
    text += `\n`;
  });

  return {
    text,
    quickReplies: ['📍 Ruangan Sekarang', '📝 Cek Tugas', '✏️ Ubah Jadwal', '📋 Jadwal Besok'],
    actionType: 'schedule',
  };
}
