import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { InsightData, ReportService } from '../services/reportService';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
}) => {
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadInsight();
    }
  }, [visible, period]);

  const loadInsight = async () => {
    setLoading(true);
    const data = await ReportService.getInsights(period);
    setInsight(data);
    setLoading(false);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    await ReportService.exportAndSharePDF(period);
    setExporting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>📊</Text>
              <View>
                <Text style={styles.headerTitle}>Insight & Evaluasi Belajar</Text>
                <Text style={styles.headerSub}>Presensi, Tugas, dan Laporan PDF</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Period Selector (1 Minggu vs 1 Bulan) */}
          <View style={styles.periodSwitcher}>
            <TouchableOpacity
              style={[styles.periodBtn, period === 'week' && styles.activePeriodBtn]}
              onPress={() => setPeriod('week')}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  period === 'week' && styles.activePeriodBtnText,
                ]}
              >
                📅 1 Minggu Terakhir
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodBtn, period === 'month' && styles.activePeriodBtn]}
              onPress={() => setPeriod('month')}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  period === 'month' && styles.activePeriodBtnText,
                ]}
              >
                🗓️ 1 Bulan Terakhir
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Menghitung statistik kehadiran & tugas...</Text>
              </View>
            ) : insight ? (
              <>
                {/* Profile & Score Banner */}
                <View style={styles.scoreBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scoreTitle}>{insight.studentName}</Text>
                    <Text style={styles.scoreSub}>Kelas: {insight.className} • Periode: {insight.periodLabel}</Text>
                  </View>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreVal}>{insight.weeklyProductivityScore}%</Text>
                    <Text style={styles.scoreLabel}>Produktivitas</Text>
                  </View>
                </View>

                {/* 1. Rekap Presensi (Hadir, Izin, Sakit, Alpa) */}
                <Text style={styles.sectionLabel}>1. Statistik Presensi & Kehadiran:</Text>
                <View style={styles.gridStats}>
                  <View style={[styles.statCard, { borderColor: '#A7F3D0' }]}>
                    <Text style={[styles.statVal, { color: '#059669' }]}>
                      {insight.attendanceStats.hadir} Hari
                    </Text>
                    <Text style={styles.statLabel}>🟢 Hadir</Text>
                  </View>

                  <View style={[styles.statCard, { borderColor: '#BFDBFE' }]}>
                    <Text style={[styles.statVal, { color: '#2563EB' }]}>
                      {insight.attendanceStats.izin} Hari
                    </Text>
                    <Text style={styles.statLabel}>🔵 Izin</Text>
                  </View>

                  <View style={[styles.statCard, { borderColor: '#FDE68A' }]}>
                    <Text style={[styles.statVal, { color: '#D97706' }]}>
                      {insight.attendanceStats.sakit} Hari
                    </Text>
                    <Text style={styles.statLabel}>🟠 Sakit</Text>
                  </View>

                  <View style={[styles.statCard, { borderColor: '#FECACA' }]}>
                    <Text style={[styles.statVal, { color: '#DC2626' }]}>
                      {insight.attendanceStats.alpa} Hari
                    </Text>
                    <Text style={styles.statLabel}>🔴 Alpa</Text>
                  </View>
                </View>

                <View style={styles.progressCard}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>Tingkat Kehadiran Sekolah</Text>
                    <Text style={styles.progressPercent}>
                      {insight.attendanceStats.percentageHadir}%
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${insight.attendanceStats.percentageHadir}%` },
                      ]}
                    />
                  </View>
                </View>

                {/* 2. Rekap Tugas */}
                <Text style={styles.sectionLabel}>2. Evaluasi Tugas Sekolah & PR:</Text>
                <View style={styles.taskCard}>
                  <View style={styles.taskRow}>
                    <Text style={styles.taskText}>✅ Tugas Selesai Tepat Waktu:</Text>
                    <Text style={styles.taskValGreen}>
                      {insight.taskStats.completed} Tugas ({insight.taskStats.percentageCompleted}%)
                    </Text>
                  </View>
                  <View style={styles.taskRow}>
                    <Text style={styles.taskText}>⏳ Tugas Belum Selesai (Pending):</Text>
                    <Text style={styles.taskValOrange}>
                      {insight.taskStats.pending} Tugas ({100 - insight.taskStats.percentageCompleted}%)
                    </Text>
                  </View>
                </View>

                {/* 3. Rekomendasi AI */}
                <Text style={styles.sectionLabel}>3. Insight & Rekomendasi AI:</Text>
                <View style={styles.aiBox}>
                  <Text style={styles.aiIcon}>💡</Text>
                  <Text style={styles.aiText}>{insight.summaryText}</Text>
                </View>
              </>
            ) : null}
          </ScrollView>

          {/* Action Footer: Export PDF */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportPDF}
              disabled={exporting}
              activeOpacity={0.8}
            >
              {exporting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.exportBtnIcon}>📄</Text>
                  <Text style={styles.exportBtnText}>
                    Download & Bagikan Laporan (.PDF)
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  closeText: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  periodSwitcher: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activePeriodBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activePeriodBtnText: {
    color: COLORS.white,
  },
  body: {
    marginBottom: 10,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  scoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scoreSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scoreCircle: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: 65,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  scoreVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginVertical: 6,
  },
  gridStats: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBarBg: {
    backgroundColor: COLORS.border,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: '#059669',
    height: '100%',
    borderRadius: 4,
  },
  taskCard: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 11,
    color: COLORS.textDark,
  },
  taskValGreen: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  taskValOrange: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D97706',
  },
  aiBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  aiIcon: {
    fontSize: 16,
  },
  aiText: {
    fontSize: 11,
    color: '#991B1B',
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    gap: 6,
    paddingTop: 6,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  exportBtnIcon: {
    fontSize: 16,
  },
  exportBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  closeBtn: {
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtnText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
});
