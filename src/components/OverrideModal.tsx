import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { DayName, ScheduleOverride } from '../types';
import { ScheduleService } from '../services/scheduleService';

interface OverrideModalProps {
  visible: boolean;
  className: string;
  initialData?: {
    day?: DayName;
    period?: number;
    currentSubject?: string;
    currentRoom?: string;
    note?: string;
    notifyOffsets?: number[];
  };
  onClose: () => void;
  onSave: (override: ScheduleOverride) => void;
}

const DAYS_LIST: { key: DayName; label: string }[] = [
  { key: 'senin', label: 'Senin' },
  { key: 'selasa', label: 'Selasa' },
  { key: 'rabu', label: 'Rabu' },
  { key: 'kamis', label: 'Kamis' },
  { key: 'jumat', label: 'Jumat' },
];

const PERIOD_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const QUICK_PRESETS = [
  { name: 'Bimbingan Konseling', code: 'BK', room: 'B.3.2' },
  { name: 'Jam Kosong / Free Class', code: 'FREE', room: 'Kelas' },
  { name: 'Praktik Lab RPL', code: 'MP1-C', room: 'Lab RPL 2' },
  { name: 'Upacara / Apel Pagi', code: 'UPACARA', room: 'Lapangan' },
  { name: 'Senam & Olahraga', code: 'SENAM', room: 'Lapangan' },
  { name: 'Kewirausahaan (PKK)', code: 'PKK-2', room: 'RPS UTR' },
];

const REMINDER_OPTIONS = [
  { label: '5m', value: 5, full: '5 Menit Sebelum' },
  { label: '10m', value: 10, full: '10 Menit Sebelum' },
  { label: '15m', value: 15, full: '15 Menit Sebelum' },
  { label: '30m', value: 30, full: '30 Menit Sebelum' },
  { label: '1 Jam', value: 60, full: '1 Jam Sebelum' },
  { label: 'H-1', value: 1440, full: '1 Hari Sebelum' },
  { label: 'H-7', value: 10080, full: '1 Minggu Sebelum' },
];

export const OverrideModal: React.FC<OverrideModalProps> = ({
  visible,
  className,
  initialData,
  onClose,
  onSave,
}) => {
  const [day, setDay] = useState<DayName>('senin');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState(1);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [room, setRoom] = useState('');
  const [note, setNote] = useState('');
  const [notifyOffsets, setNotifyOffsets] = useState<number[]>([15, 30]);

  // Retain & pre-fill existing schedule data and reminder options
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setDay(initialData.day || 'senin');
        setPeriod(initialData.period || 1);
        setSubjectName(initialData.currentSubject || '');
        setRoom(initialData.currentRoom || '');
        setNote(initialData.note || '');
        if (initialData.notifyOffsets && initialData.notifyOffsets.length > 0) {
          setNotifyOffsets(initialData.notifyOffsets);
        } else {
          setNotifyOffsets([15, 30]);
        }
      } else {
        const todayKey = ScheduleService.getDayKeyFromDate(new Date());
        setDay(['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(todayKey) ? todayKey : 'senin');
        setPeriod(1);
        setSubjectName('');
        setSubjectCode('');
        setRoom('');
        setNote('');
        setNotifyOffsets([15, 30]);
      }
      setDateStr(new Date().toISOString().split('T')[0]);
    }
  }, [visible, initialData]);

  // Date Presets (Hari Ini, Besok, Lusa)
  const handleQuickDate = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setDateStr(`${yyyy}-${mm}-${dd}`);

    const dayKey = ScheduleService.getDayKeyFromDate(target);
    if (['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(dayKey)) {
      setDay(dayKey);
    }
  };

  const handleDateChange = (text: string) => {
    setDateStr(text);
    if (text.length === 10) {
      const parsedDate = new Date(text);
      if (!isNaN(parsedDate.getTime())) {
        const dayKey = ScheduleService.getDayKeyFromDate(parsedDate);
        if (['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(dayKey)) {
          setDay(dayKey);
        }
      }
    }
  };

  const handleToggleOffset = (val: number) => {
    if (notifyOffsets.includes(val)) {
      setNotifyOffsets(notifyOffsets.filter(v => v !== val));
    } else {
      setNotifyOffsets([...notifyOffsets, val].sort((a, b) => a - b));
    }
  };

  const handleApplyPreset = (preset: { name: string; code: string; room: string }) => {
    setSubjectName(preset.name);
    setSubjectCode(preset.code);
    setRoom(preset.room);
    setNote(`Diubah ke ${preset.name}`);
  };

  const handleSave = () => {
    const override: ScheduleOverride = {
      id: Date.now().toString(),
      className,
      day,
      period,
      newSubjectName: subjectName.trim() || undefined,
      newSubjectCode: subjectCode.trim() || undefined,
      newRoom: room.trim() || undefined,
      note: note.trim() || 'Perubahan Mandiri',
      notifyOffsets: notifyOffsets.length > 0 ? notifyOffsets : [15],
      createdAt: new Date().toISOString(),
    };

    onSave(override);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerIcon}>✏️</Text>
              <View>
                <Text style={styles.headerTitle}>Edit Jadwal Pelajaran</Text>
                <Text style={styles.headerSub}>Kelas {className} • Kalender & Pengingat</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. FILTERING KALENDER & TANGGAL */}
            <Text style={styles.sectionLabel}>📅 Kalender & Hari Pelajaran:</Text>
            <View style={styles.quickDateRow}>
              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => handleQuickDate(0)}
              >
                <Text style={styles.quickDateText}>Hari Ini</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => handleQuickDate(1)}
              >
                <Text style={styles.quickDateText}>Besok</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => handleQuickDate(2)}
              >
                <Text style={styles.quickDateText}>Lusa</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (cth: 2026-08-24)"
              placeholderTextColor={COLORS.textLight}
              value={dateStr}
              onChangeText={handleDateChange}
            />

            {/* Pilihan Hari */}
            <View style={styles.daysRow}>
              {DAYS_LIST.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.dayChip, day === d.key && styles.activeDayChip]}
                  onPress={() => setDay(d.key)}
                >
                  <Text style={[styles.dayChipText, day === d.key && styles.activeDayChipText]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pilihan Jam Ke */}
            <Text style={styles.sectionLabel}>⏰ Jam Pelajaran Ke-:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
              {PERIOD_LIST.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodChip, period === p && styles.activePeriodChip]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.periodChipText, period === p && styles.activePeriodChipText]}>
                    Ke-{p}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Template Perubahan Cepat */}
            <Text style={styles.sectionLabel}>⚡ Template Perubahan Cepat:</Text>
            <View style={styles.presetGrid}>
              {QUICK_PRESETS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetItem}
                  onPress={() => handleApplyPreset(preset)}
                >
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Text style={styles.presetSub}>{preset.code} • {preset.room}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Detail Mapel & Ruangan */}
            <Text style={styles.sectionLabel}>📖 Detail Pengganti (Data Lama Tersimpan):</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama Mata Pelajaran Baru"
              placeholderTextColor={COLORS.textLight}
              value={subjectName}
              onChangeText={setSubjectName}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Kode Mapel (cth: BK, FREE)"
                placeholderTextColor={COLORS.textLight}
                value={subjectCode}
                onChangeText={setSubjectCode}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ruangan Baru (cth: B.3.2)"
                placeholderTextColor={COLORS.textLight}
                value={room}
                onChangeText={setRoom}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Catatan (cth: Guru rapat, tugas modul 3)"
              placeholderTextColor={COLORS.textLight}
              value={note}
              onChangeText={setNote}
            />

            {/* 2. PENGINGAT ALARM MULTI-SELECT (BERSUARA & GETAR) */}
            <Text style={styles.sectionLabel}>
              🔔 Pengingat Alarm (Suara & Getar) — Bisa Centang &gt;1:
            </Text>
            <View style={styles.reminderGrid}>
              {REMINDER_OPTIONS.map(opt => {
                const isSelected = notifyOffsets.includes(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.reminderChip, isSelected && styles.activeReminderChip]}
                    onPress={() => handleToggleOffset(opt.value)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.reminderCheck, isSelected && styles.activeReminderCheck]}>
                      {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                    </View>
                    <Text style={[styles.reminderText, isSelected && styles.activeReminderText]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!subjectName.trim() && !subjectCode.trim()) && styles.disabledSaveBtn]}
              onPress={handleSave}
              disabled={!subjectName.trim() && !subjectCode.trim()}
            >
              <Text style={styles.saveText}>✓ Simpan Perubahan Jadwal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerTitleBox: {
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
  closeBtn: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 8,
    marginBottom: 6,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  quickDateBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 6,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeDayChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayChipText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeDayChipText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  periodScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  activePeriodChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodChipText: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  activePeriodChipText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  presetItem: {
    width: '48%',
    backgroundColor: COLORS.primaryLight,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  presetName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  presetSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textDark,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  reminderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  activeReminderChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  reminderCheck: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeReminderCheck: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkIcon: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  reminderText: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  activeReminderText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontWeight: 'bold',
    fontSize: 12,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledSaveBtn: {
    backgroundColor: COLORS.border,
  },
  saveText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
