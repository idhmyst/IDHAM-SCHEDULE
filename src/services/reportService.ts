import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import { AttendanceService } from './attendanceService';
import { StorageService } from './storage';
import { CloudSyncService } from './cloudSync';
import { KnowledgeService } from './knowledgeService';

export interface AttendanceStats {
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
  percentageHadir: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  percentageCompleted: number;
}

export interface InsightData {
  studentName: string;
  className: string;
  periodLabel: string;
  attendanceStats: AttendanceStats;
  taskStats: TaskStats;
  weeklyProductivityScore: number;
  summaryText: string;
}

export const ReportService = {
  async getInsights(period: 'week' | 'month' = 'month'): Promise<InsightData> {
    const history = await AttendanceService.getHistory();
    const tasks = await StorageService.getTasks();
    const profile = await CloudSyncService.getLocalProfile();

    const studentName = profile?.fullName || 'Idham Baihaqi';
    const className = profile?.className || 'XII PPLG 3';

    const now = new Date();
    const filterDays = period === 'week' ? 7 : 30;

    // Filter attendance in period
    const filteredAttendance = history.filter(item => {
      const itemDate = new Date(item.date);
      const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= filterDays && diffDays >= 0;
    });

    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    filteredAttendance.forEach(item => {
      if (item.type === 'DATANG' || item.status.toLowerCase().includes('hadir') || item.status.toLowerCase().includes('masuk')) {
        hadir++;
      } else if (item.type === 'IZIN') {
        izin++;
      } else if (item.type === 'SAKIT') {
        sakit++;
      } else {
        alpa++;
      }
    });

    // Default simulation baseline if history is just starting
    if (filteredAttendance.length === 0) {
      hadir = period === 'week' ? 5 : 20;
      izin = 1;
      sakit = 0;
      alpa = 0;
    }

    const totalAttendance = hadir + izin + sakit + alpa;
    const percentageHadir = totalAttendance > 0 ? Math.round((hadir / totalAttendance) * 100) : 100;

    // Task stats
    const totalTasks = tasks.length > 0 ? tasks.length : 6;
    const completedTasks = tasks.length > 0 ? tasks.filter(t => t.isCompleted).length : 5;
    const pendingTasks = totalTasks - completedTasks;
    const percentageCompleted = Math.round((completedTasks / totalTasks) * 100);

    const weeklyProductivityScore = Math.round((percentageHadir * 0.5) + (percentageCompleted * 0.5));

    let summaryText = 'Perkembangan belajar Anda sangat konsisten dan memuaskan! Pertahankan kehadiran dan kedisiplinan pengumpulan tugas sekolah.';
    if (weeklyProductivityScore < 75) {
      summaryText = 'Tingkatkan lagi penyelesaian tugas sekolah sebelum tenggat waktu dan pastikan presensi selalu tepat waktu.';
    }

    return {
      studentName,
      className,
      periodLabel: period === 'week' ? '1 Minggu Terakhir' : '1 Bulan Terakhir',
      attendanceStats: {
        hadir,
        izin,
        sakit,
        alpa,
        total: totalAttendance,
        percentageHadir,
      },
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        percentageCompleted,
      },
      weeklyProductivityScore,
      summaryText,
    };
  },

  generateHTMLReport(insight: InsightData): string {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Laporan Perkembangan & Presensi Siswa</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1E293B;
      margin: 0;
      padding: 24px;
      background-color: #FFFFFF;
    }
    .header {
      border-bottom: 3px solid #D90000;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 20px;
      font-weight: bold;
      color: #D90000;
      margin: 0;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748B;
      margin: 2px 0 0 0;
    }
    .doc-date {
      font-size: 10px;
      color: #94A3B8;
      text-align: right;
    }
    .profile-box {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .profile-title {
      font-size: 14px;
      font-weight: bold;
      color: #0F172A;
      margin: 0 0 4px 0;
    }
    .profile-meta {
      font-size: 11px;
      color: #475569;
      margin: 0;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      color: #D90000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 18px 0 8px 0;
      border-left: 3px solid #D90000;
      padding-left: 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .stat-card {
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .stat-val {
      font-size: 20px;
      font-weight: bold;
      color: #0F172A;
      margin: 0;
    }
    .stat-label {
      font-size: 9px;
      color: #64748B;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .progress-bar-bg {
      background-color: #E2E8F0;
      border-radius: 6px;
      height: 10px;
      overflow: hidden;
      margin: 6px 0;
    }
    .progress-bar-fill {
      background-color: #D90000;
      height: 100%;
      border-radius: 6px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 11px;
    }
    .table th {
      background-color: #F1F5F9;
      color: #334155;
      text-align: left;
      padding: 8px;
      border: 1px solid #CBD5E1;
    }
    .table td {
      padding: 8px;
      border: 1px solid #E2E8F0;
    }
    .badge-green { color: #059669; font-weight: bold; }
    .badge-orange { color: #D97706; font-weight: bold; }
    .badge-blue { color: #2563EB; font-weight: bold; }
    .badge-red { color: #DC2626; font-weight: bold; }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #E2E8F0;
      padding-top: 12px;
      font-size: 9px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">IDHAM SCHEDULE • REPORT</h1>
      <p class="brand-sub">SMK Telkom Purwokerto — Evaluasi Presensi & Perkembangan Belajar</p>
    </div>
    <div class="doc-date">
      <strong>Periode: ${insight.periodLabel}</strong><br>
      Dicetak: ${todayStr}
    </div>
  </div>

  <div class="profile-box">
    <h2 class="profile-title">${insight.studentName}</h2>
    <p class="profile-meta">Kelas: <strong>${insight.className}</strong> | Status: <strong>Siswa Aktif</strong> | Skor Produktivitas: <strong style="color:#D90000;">${insight.weeklyProductivityScore}%</strong></p>
  </div>

  <div class="section-title">1. Statistik Kehadiran & Presensi (Bulanan)</div>
  <div class="grid">
    <div class="stat-card">
      <div class="stat-val badge-green">${insight.attendanceStats.hadir} Hari</div>
      <div class="stat-label">Hadir / Tepat Waktu</div>
    </div>
    <div class="stat-card">
      <div class="stat-val badge-blue">${insight.attendanceStats.izin} Hari</div>
      <div class="stat-label">Izin</div>
    </div>
    <div class="stat-card">
      <div class="stat-val badge-orange">${insight.attendanceStats.sakit} Hari</div>
      <div class="stat-label">Sakit</div>
    </div>
    <div class="stat-card">
      <div class="stat-val badge-red">${insight.attendanceStats.alpa} Hari</div>
      <div class="stat-label">Alpa / Tanpa Ket.</div>
    </div>
  </div>

  <p style="font-size: 11px; margin: 4px 0;">Persentase Tingkat Kehadiran: <strong>${insight.attendanceStats.percentageHadir}%</strong></p>
  <div class="progress-bar-bg">
    <div class="progress-bar-fill" style="width: ${insight.attendanceStats.percentageHadir}%;"></div>
  </div>

  <div class="section-title">2. Perkembangan Penyelesaian Tugas & PR Sekolah</div>
  <table class="table">
    <thead>
      <tr>
        <th>Kategori Metrik</th>
        <th>Jumlah</th>
        <th>Persentase</th>
        <th>Status Evaluasi</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Tugas Tuntas / Selesai</td>
        <td><strong>${insight.taskStats.completed} Tugas</strong></td>
        <td><strong>${insight.taskStats.percentageCompleted}%</strong></td>
        <td><span class="badge-green">Tuntas Tepat Waktu ✓</span></td>
      </tr>
      <tr>
        <td>Tugas Dalam Proses / Pending</td>
        <td><strong>${insight.taskStats.pending} Tugas</strong></td>
        <td><strong>${100 - insight.taskStats.percentageCompleted}%</strong></td>
        <td><span class="badge-orange">Perlu Diselesaikan Segera</span></td>
      </tr>
      <tr>
        <td>Total Tugas Periode Ini</td>
        <td><strong>${insight.taskStats.total} Tugas</strong></td>
        <td>100%</td>
        <td>-</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">3. Catatan & Insight Rekomendasi AI</div>
  <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 10px; font-size: 11px; color: #991B1B; line-height: 1.5;">
    💡 <strong>Insight AI:</strong> ${insight.summaryText}
  </div>

  <div class="footer">
    <span>Dokumen Laporan Resmi IDHAM SCHEDULE AI Bot</span>
    <span>SMK Telkom Purwokerto — Jurusan Pengembangan Perangkat Lunak & Gim (PPLG)</span>
  </div>
</body>
</html>
    `;
  },

  // 1. Export PDF
  async exportAndSharePDF(period: 'week' | 'month' = 'month'): Promise<void> {
    try {
      const insight = await this.getInsights(period);
      const html = this.generateHTMLReport(insight);

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Laporan Perkembangan & Presensi - ${insight.studentName}.pdf`,
        });
      } else {
        Alert.alert('Laporan PDF Siap', `File PDF tersimpan di: ${uri}`);
      }
    } catch (e) {
      console.error('PDF Export error:', e);
      Alert.alert('Error', 'Gagal membuat file laporan PDF.');
    }
  },

  // 2. Export Excel / CSV Spreadsheet (All User Activity & Inputs During Login)
  async exportAndShareExcel(): Promise<void> {
    try {
      const profile = await CloudSyncService.getLocalProfile();
      const attendance = await AttendanceService.getHistory();
      const tasks = await StorageService.getTasks();
      const meetings = await StorageService.getMeetings();
      const overrides = await StorageService.getOverrides();
      const knowledge = await KnowledgeService.getAllDocuments();

      const studentName = profile?.fullName || 'Idham Baihaqi';
      const studentEmail = profile?.email || 'idham@example.com';
      const studentClass = profile?.className || 'XII PPLG 3';
      const exportTime = new Date().toLocaleString('id-ID');

      // Build UTF-8 BOM CSV Excel format with semicolon delimiter
      let csvContent = '\uFEFF';

      // Header Sheet Info
      csvContent += `REKAPITULASI AKTIVITAS & INPUT DATA IDHAM SCHEDULE\n`;
      csvContent += `Siswa;${studentName}\n`;
      csvContent += `Email Akun;${studentEmail}\n`;
      csvContent += `Kelas;${studentClass}\n`;
      csvContent += `Waktu Ekspor;${exportTime}\n`;
      csvContent += `Aplikasi;IDHAM SCHEDULE - SMK Telkom Purwokerto\n\n`;

      // SECTION 1: PRESENSI & KEHADIRAN
      csvContent += `[ 1. REKAP RIWAYAT PRESENSI & ABSENSI SISWA ]\n`;
      csvContent += `No;Tanggal;Waktu (WIB);Tipe Presensi;Status;Nama Lokasi;Latitude;Longitude;Target Siswa;NIS;QR Embedded\n`;
      if (attendance.length === 0) {
        csvContent += `1;${new Date().toISOString().split('T')[0]};07:00;DATANG;Hadir Tepat Waktu;SMK Telkom Purwokerto;-7.433924;109.248612;${studentName};541221001;Ya\n`;
      } else {
        attendance.forEach((att, idx) => {
          csvContent += `${idx + 1};${att.date};${att.time};${att.type};${att.status};"${att.locationName}";${att.latitude};${att.longitude};"${att.studentName}";${att.studentNis};${att.qrPayload ? 'Ya' : 'Tidak'}\n`;
        });
      }
      csvContent += `\n`;

      // SECTION 2: TUGAS SEKOLAH & PR
      csvContent += `[ 2. REKAP INPUT TUGAS SEKOLAH & DEADLINE ]\n`;
      csvContent += `No;Judul Tugas;Mata Pelajaran;Deadline Tanggal;Deadline Jam;Status;Lampiran File;Tanggal Ditambahkan\n`;
      if (tasks.length === 0) {
        csvContent += `1;Tugas Proyek PPLG;Konsentrasi Kejuruan;${new Date().toISOString().split('T')[0]};23:59;Selesai;modul.pdf;${new Date().toISOString().split('T')[0]}\n`;
      } else {
        tasks.forEach((t, idx) => {
          const status = t.isCompleted ? 'Selesai' : 'Belum Selesai (Pending)';
          const file = t.attachedFileName || '-';
          csvContent += `${idx + 1};"${t.title}";"${t.subject}";${t.deadlineDate};${t.deadlineTime};${status};"${file}";${t.createdAt.split('T')[0]}\n`;
        });
      }
      csvContent += `\n`;

      // SECTION 3: AGENDA & MEETING
      csvContent += `[ 3. REKAP INPUT AGENDA & JANJI MEETING ]\n`;
      csvContent += `No;Judul Agenda / Meeting;Tanggal;Waktu (WIB);Lokasi;Catatan;Status\n`;
      if (meetings.length === 0) {
        csvContent += `1;Rapat Divisi IT OSIS;${new Date().toISOString().split('T')[0]};14:00;Lab RPL;-;Selesai\n`;
      } else {
        meetings.forEach((m, idx) => {
          const status = m.isCompleted ? 'Selesai' : 'Mendatang';
          csvContent += `${idx + 1};"${m.title}";${m.date};${m.time};"${m.location}";"${m.notes || '-'}";${status}\n`;
        });
      }
      csvContent += `\n`;

      // SECTION 4: PERUBAHAN JADWAL SEMENTARA (OVERRIDES)
      csvContent += `[ 4. REKAP PERUBAHAN JADWAL SEMENTARA (OVERRIDES) ]\n`;
      csvContent += `No;Hari;Jam Ke;Kelas;Kode Mapel;Nama Mapel Baru;Ruangan Baru\n`;
      if (overrides.length === 0) {
        csvContent += `1;SENIN;Jam ke-1;XII PPLG 3;MP1-C;Konsentrasi Kejuruan;Lab RPL\n`;
      } else {
        overrides.forEach((o, idx) => {
          csvContent += `${idx + 1};${o.day.toUpperCase()};Jam ke-${o.period};${o.className};${o.newSubjectCode || '-'};"${o.newSubjectName || '-'}";"${o.newRoom || '-'}"\n`;
        });
      }
      csvContent += `\n`;

      // SECTION 5: MATERI & DOKUMEN PEMBELAJARAN AI
      csvContent += `[ 5. DOKUMEN & MATERI TERPELAJARI BOT ]\n`;
      csvContent += `No;Judul Materi;Nama File Sumber;Ringkasan Isi;Tanggal Unggah\n`;
      if (knowledge.length === 0) {
        csvContent += `1;Modul PPLG;modul_pplg.pdf;Materi dasar pengembangan aplikasi mobile dan web.;${new Date().toISOString().split('T')[0]}\n`;
      } else {
        knowledge.forEach((k, idx) => {
          const summary = (k.summary || k.textContent || '-').replace(/"/g, '""').slice(0, 100);
          csvContent += `${idx + 1};"${k.title}";"${k.fileName}";"${summary}";${k.createdAt.split('T')[0]}\n`;
        });
      }

      // Save file to cache
      const filename = `Rekap_Aktivitas_${studentName.replace(/\s+/g, '_')}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(fileUri, {
          UTI: 'public.comma-separated-values-text',
          mimeType: 'text/csv',
          dialogTitle: `Ekspor Excel Aktivitas Siswa - ${filename}`,
        });
      } else {
        Alert.alert('File Excel Siap 📊', `File tersimpan di: ${fileUri}`);
      }
    } catch (err) {
      console.error('Excel export error:', err);
      Alert.alert('Error', 'Gagal membuat file Excel/CSV rekap aktivitas.');
    }
  },
};
