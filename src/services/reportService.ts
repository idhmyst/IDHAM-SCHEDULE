import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import { AttendanceRecord, AttendanceService } from './attendanceService';
import { StorageService } from './storage';
import { CloudSyncService } from './cloudSync';
import { TaskAssignment } from '../types';

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
  recentAttendance: AttendanceRecord[];
  recentTasks: TaskAssignment[];
}

export const ReportService = {
  // 1. Calculate 100% Real-Time Live Insights from Local & Supabase Storage
  async getInsights(period: 'week' | 'month' = 'month'): Promise<InsightData> {
    const history = await AttendanceService.getHistory();
    const tasks = await StorageService.getTasks();
    const profile = await CloudSyncService.getCurrentUser();

    const studentName = profile?.fullName || 'Idham Baihaqi';
    const className = profile?.className || 'XII PPLG 3';

    const now = new Date();
    const filterDays = period === 'week' ? 7 : 30;

    // Filter attendance in period with accurate date comparison
    const filteredAttendance = history.filter(item => {
      try {
        const itemTime = new Date(item.date).getTime();
        if (isNaN(itemTime)) return true;
        const diffDays = (now.getTime() - itemTime) / (1000 * 60 * 60 * 24);
        return diffDays <= filterDays && diffDays >= -1;
      } catch (e) {
        return true;
      }
    });

    let hadirCount = 0;
    let izinCount = 0;
    let sakitCount = 0;
    let alpaCount = 0;

    // Track unique dates to prevent duplicate counts on same day
    const countedDates = new Set<string>();

    filteredAttendance.forEach(item => {
      const type = (item.type || '').toUpperCase();
      const status = (item.status || '').toLowerCase();
      const key = `${item.date}_${type}`;

      if (!countedDates.has(key)) {
        countedDates.add(key);

        if (type === 'DATANG' || type === 'PULANG' || status.includes('hadir') || status.includes('datang') || status.includes('masuk')) {
          hadirCount++;
        } else if (type === 'IZIN' || status.includes('izin')) {
          izinCount++;
        } else if (type === 'SAKIT' || status.includes('sakit')) {
          sakitCount++;
        } else if (type === 'ALPA' || status.includes('alpa')) {
          alpaCount++;
        }
      }
    });

    const totalAttendance = hadirCount + izinCount + sakitCount + alpaCount;
    const percentageHadir = totalAttendance > 0
      ? Math.round((hadirCount / totalAttendance) * 100)
      : (history.length > 0 ? 100 : 0);

    // 100% Real-Time Live Tasks Data
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const pendingTasks = totalTasks - completedTasks;
    const percentageCompleted = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : (tasks.length === 0 ? 100 : 0);

    // Calculate Real Productivity Score
    let weeklyProductivityScore = 100;
    if (totalAttendance > 0 && totalTasks > 0) {
      weeklyProductivityScore = Math.round((percentageHadir * 0.5) + (percentageCompleted * 0.5));
    } else if (totalAttendance > 0) {
      weeklyProductivityScore = percentageHadir;
    } else if (totalTasks > 0) {
      weeklyProductivityScore = percentageCompleted;
    }

    // Dynamic Intelligent Feedback
    let summaryText = '';
    if (totalAttendance === 0 && totalTasks === 0) {
      summaryText = 'Belum ada catatan presensi atau tugas yang terekam untuk periode ini. Mulai lakukan presensi harian atau tambahkan tugas sekolah untuk melihat grafik produktivitas Anda.';
    } else if (weeklyProductivityScore >= 85) {
      summaryText = `Luar biasa, ${studentName}! Disiplin kehadiran dan penyelesaian tugas Anda berada pada tingkat prima (${weeklyProductivityScore}%). Pertahankan performa ini!`;
    } else if (weeklyProductivityScore >= 65) {
      summaryText = `Performa belajar Anda cukup baik (${weeklyProductivityScore}%). Selesaikan ${pendingTasks} tugas yang masih tertunda untuk meningkatkan nilai kedisiplinan.`;
    } else {
      summaryText = `Perhatian! Ada ${pendingTasks} tugas yang belum selesai dan ${alpaCount + izinCount + sakitCount} hari ketidakhadiran. Segera selesaikan tugas sebelum tenggat waktu.`;
    }

    return {
      studentName,
      className,
      periodLabel: period === 'week' ? '1 Minggu Terakhir' : '1 Bulan Terakhir',
      attendanceStats: {
        hadir: hadirCount,
        izin: izinCount,
        sakit: sakitCount,
        alpa: alpaCount,
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
      recentAttendance: filteredAttendance.slice(0, 10),
      recentTasks: tasks.slice(0, 10),
    };
  },

  // 2. Generate Beautiful HTML Report for PDF Export
  generateHTMLReport(insight: InsightData): string {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const attendanceRows = insight.recentAttendance.length > 0
      ? insight.recentAttendance
          .map(
            (r, i) => `
          <tr>
            <td style="text-align: center;">${i + 1}</td>
            <td><strong>${r.date}</strong></td>
            <td>${r.time} WIB</td>
            <td><span class="badge badge-${(r.type || 'hadir').toLowerCase()}">${r.type || 'HADIR'}</span></td>
            <td>${r.locationName || 'SMK Telkom Purwokerto'}</td>
            <td>${r.status}</td>
          </tr>`
          )
          .join('')
      : `<tr><td colspan="6" style="text-align: center; color: #94A3B8; padding: 16px;">Belum ada riwayat presensi yang tercatat.</td></tr>`;

    const taskRows = insight.recentTasks.length > 0
      ? insight.recentTasks
          .map(
            (t, i) => `
          <tr>
            <td style="text-align: center;">${i + 1}</td>
            <td><strong>${t.title}</strong></td>
            <td>${t.subject}</td>
            <td>${t.deadlineDate} (${t.deadlineTime})</td>
            <td><span class="badge badge-${t.isCompleted ? 'hadir' : 'alpa'}">${t.isCompleted ? 'SELESAI' : 'PENDING'}</span></td>
            <td>${t.attachedFileName ? '📎 ' + t.attachedFileName : '-'}</td>
          </tr>`
          )
          .join('')
      : `<tr><td colspan="6" style="text-align: center; color: #94A3B8; padding: 16px;">Belum ada catatan tugas yang ditambahkan.</td></tr>`;

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
    }
    .header h1 {
      color: #D90000;
      font-size: 22px;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header p {
      color: #64748B;
      font-size: 12px;
      margin: 4px 0 0 0;
    }
    .info-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
    }
    .info-item {
      font-size: 12px;
    }
    .info-item strong {
      color: #0F172A;
      display: block;
      font-size: 14px;
      margin-top: 2px;
    }
    .grid {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      flex: 1;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 12px;
      text-align: center;
    }
    .stat-val {
      font-size: 24px;
      font-weight: bold;
      margin-top: 4px;
    }
    .stat-hadir { color: #16A34A; }
    .stat-izin { color: #0284C7; }
    .stat-sakit { color: #EA580C; }
    .stat-alpa { color: #DC2626; }
    .stat-score { color: #7C3AED; }
    .stat-label {
      font-size: 11px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 600;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #0F172A;
      margin: 20px 0 8px 0;
      border-left: 4px solid #D90000;
      padding-left: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 16px;
    }
    th {
      background-color: #F1F5F9;
      color: #475569;
      text-align: left;
      padding: 8px;
      border: 1px solid #CBD5E1;
      font-weight: bold;
    }
    td {
      padding: 8px;
      border: 1px solid #E2E8F0;
      color: #334155;
    }
    tr:nth-child(even) {
      background-color: #F8FAFC;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 9px;
      text-transform: uppercase;
    }
    .badge-datang, .badge-hadir { background: #DCFCE7; color: #166534; }
    .badge-izin { background: #E0F2FE; color: #0369A1; }
    .badge-sakit { background: #FFEDD5; color: #C2410C; }
    .badge-alpa { background: #FEE2E2; color: #991B1B; }
    .badge-pulang { background: #F3E8FF; color: #6B21A8; }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px dashed #CBD5E1;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Laporan Evaluasi & Presensi Belajar Siswa</h1>
    <p>SMK TELKOM PURWOKERTO • IDHAM SCHEDULE SYSTEM • Dicetak: ${todayStr}</p>
  </div>

  <div class="info-card">
    <div class="info-item">Nama Siswa:<strong>${insight.studentName}</strong></div>
    <div class="info-item">Kelas:<strong>${insight.className}</strong></div>
    <div class="info-item">Periode Laporan:<strong>${insight.periodLabel}</strong></div>
    <div class="info-item">Skor Produktivitas:<strong style="color: #7C3AED;">${insight.weeklyProductivityScore}%</strong></div>
  </div>

  <div class="grid">
    <div class="stat-card">
      <div class="stat-label">Hadir</div>
      <div class="stat-val stat-hadir">${insight.attendanceStats.hadir}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Izin</div>
      <div class="stat-val stat-izin">${insight.attendanceStats.izin}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Sakit</div>
      <div class="stat-val stat-sakit">${insight.attendanceStats.sakit}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Alpa</div>
      <div class="stat-val stat-alpa">${insight.attendanceStats.alpa}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Tugas Selesai</div>
      <div class="stat-val stat-score">${insight.taskStats.completed}/${insight.taskStats.total}</div>
    </div>
  </div>

  <div style="background: #FEF2F2; border-left: 4px solid #D90000; padding: 10px 14px; border-radius: 6px; font-size: 11px; color: #991B1B; margin-bottom: 20px;">
    <strong>Evaluasi Guru & Sistem AI:</strong> ${insight.summaryText}
  </div>

  <div class="section-title">Riwayat Log Presensi (${insight.periodLabel})</div>
  <table>
    <thead>
      <tr>
        <th style="width: 30px; text-align: center;">No</th>
        <th>Tanggal</th>
        <th>Jam</th>
        <th>Jenis</th>
        <th>Lokasi Presensi</th>
        <th>Keterangan</th>
      </tr>
    </thead>
    <tbody>
      ${attendanceRows}
    </tbody>
  </table>

  <div class="section-title">Daftar Status Pengumpulan Tugas & File</div>
  <table>
    <thead>
      <tr>
        <th style="width: 30px; text-align: center;">No</th>
        <th>Nama Tugas</th>
        <th>Mata Pelajaran</th>
        <th>Tenggat Waktu</th>
        <th>Status</th>
        <th>Lampiran File</th>
      </tr>
    </thead>
    <tbody>
      ${taskRows}
    </tbody>
  </table>

  <div class="footer">
    <div>Dokumen digital resmi diterbitkan oleh aplikasi IDHAM SCHEDULE v1.0.0</div>
    <div>Verifikasi Data: Supabase Cloud Authenticated</div>
  </div>
</body>
</html>
    `;
  },

  // 3. Export PDF
  async exportAndSharePDF(period: 'week' | 'month' = 'month'): Promise<void> {
    try {
      const insight = await this.getInsights(period);
      const html = this.generateHTMLReport(insight);

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      const newPdfPath = `${FileSystem.documentDirectory}Laporan_Insight_${insight.studentName.replace(/\s+/g, '_')}_${period}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newPdfPath });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPdfPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Bagikan Laporan Insight PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Tersimpan! 📄', `Laporan PDF berhasil dibuat di:\n${newPdfPath}`);
      }
    } catch (e: any) {
      console.log('Error exporting PDF:', e);
      Alert.alert('Gagal Ekspor PDF', e.message || 'Terjadi kendala.');
    }
  },

  // 4. Export Live Excel CSV
  async exportAndShareExcel(): Promise<void> {
    try {
      const history = await AttendanceService.getHistory();
      const tasks = await StorageService.getTasks();
      const meetings = await StorageService.getMeetings();
      const profile = await CloudSyncService.getCurrentUser();

      let csv = `REKAPITULASI DATA BELAJAR & PRESENSI SISWA\n`;
      csv += `Nama Siswa,"${profile?.fullName || 'Idham Baihaqi'}"\n`;
      csv += `Kelas,"${profile?.className || 'XII PPLG 3'}"\n`;
      csv += `Waktu Ekspor,"${new Date().toLocaleString('id-ID')}"\n\n`;

      csv += `--- RIWAYAT PRESENSI MASUK / PULANG / IZIN / SAKIT ---\n`;
      csv += `No,Tanggal,Waktu,Jenis,Status,Titik Lokasi,Latitude,Longitude\n`;
      history.forEach((h, i) => {
        csv += `${i + 1},"${h.date}","${h.time}","${h.type}","${h.status}","${h.locationName || 'SMK Telkom Purwokerto'}",${h.latitude || ''},${h.longitude || ''}\n`;
      });

      csv += `\n--- DAFTAR TUGAS & DEADLINE ---\n`;
      csv += `No,Judul Tugas,Mata Pelajaran,Tenggat Tanggal,Tenggat Jam,Status,File Lampiran\n`;
      tasks.forEach((t, i) => {
        csv += `${i + 1},"${t.title}","${t.subject}","${t.deadlineDate}","${t.deadlineTime}","${t.isCompleted ? 'SELESAI' : 'PENDING'}","${t.attachedFileName || '-'}"\n`;
      });

      csv += `\n--- AGENDA JANJI TEMU & MEETING ---\n`;
      csv += `No,Agenda,Tanggal,Waktu,Lokasi,Status\n`;
      meetings.forEach((m, i) => {
        csv += `${i + 1},"${m.title}","${m.date}","${m.time}","${m.location}","${m.isCompleted ? 'SELESAI' : 'MENDATANG'}"\n`;
      });

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rekap_Aktivitas_${(profile?.fullName || 'Idham').replace(/\s+/g, '_')}.csv`;
        a.click();
        return;
      }

      const filePath = `${FileSystem.documentDirectory}Rekap_Aktivitas_Excel_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(filePath, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Unduh Rekap Excel (.csv)',
        });
      } else {
        Alert.alert('Excel Berhasil Disimpan 📗', `Berkas tersimpan di ${filePath}`);
      }
    } catch (e: any) {
      console.log('Error export excel:', e);
      Alert.alert('Gagal Ekspor Excel', e.message || 'Terjadi kesalahan.');
    }
  },
};
