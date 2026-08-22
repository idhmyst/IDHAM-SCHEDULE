# 📱 IDHAM SCHEDULE — Android Offline Bot & Schedule Manager

Aplikasi Android cerdas berbasis **React Native (Expo)** yang berfungsi **100% Offline** untuk manajemen jadwal pelajaran, denah ruangan, seragam harian, perubahan jadwal mandiri (override), dan janji meeting bagi siswa SMK Telkom Purwokerto (Default Kelas: **XII PPLG 3**).

---

## 🎨 Spesifikasi Tema & Brand
- **Primary Color:** `#D90000` (Merah Telkom)
- **Secondary Color:** `#FFFFFF` (Putih Bersih)
- **Icon:** Custom IDHAM SCHEDULE Icon
- **Package ID:** `com.idham.schedule`

---

## 🚀 Fitur Utama

1. **💬 Offline AI/Rule Bot:**
   - Menanyakan jadwal pelajaran hari ini, besok, atau hari tertentu (Senin–Jumat).
   - Menanyakan lokasi ruangan saat ini & mapel yang sedang berlangsung.
   - Menanyakan aturan pakaian seragam harian.
   - Mencatat agenda meeting langsung melalui percakapan alami.
   - Mengubah jadwal darurat secara fleksibel.
2. **📅 Timeline Jadwal Mingguan:**
   - Tab navigasi hari (Senin s.d. Jumat).
   - Banner seragam resmi.
   - Status live jam pelajaran aktif dan tombol cepat edit.
3. **📝 Agenda & Janji Meeting:**
   - Filter agenda (Semua, Mendatang, Selesai).
   - Penanda checklist selesai, tanggal, jam WIB, dan lokasi.
   - Floating Action Button (+) untuk menambah agenda baru.
4. **⚙️ Pengaturan & Manajemen Data:**
   - Pilihan kelas utama (XII PPLG 1–7, XII TJKT 1–5).
   - Daftar override aktif (bisa dihapus kapan saja untuk kembali ke jadwal baku master).
   - Fitur pembersih riwayat chat.

---

## 🛠️ Cara Menjalankan Aplikasi Secara Lokal (Development)

1. Jalankan Metro bundler:
   ```bash
   npx expo start
   ```
2. Scan QR Code menggunakan aplikasi **Expo Go** di HP Android Anda.

---

## 📦 Cara Build Menjadi File Standalone `.apk`

Aplikasi ini sudah dikonfigurasi penuh dengan file `eas.json` (Profile `preview` -> output `.apk`).

### Opsi 1: Build Menggunakan EAS Cloud (Sangat Direkomendasikan & Cepat)
Anda tidak perlu menginstall Android Studio atau Java SDK di laptop:

1. Login ke akun Expo (jika belum, buat gratis di expo.dev):
   ```bash
   npx eas-cli login
   ```
2. Jalankan perintah build APK:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
3. Tunggu proses build selesai (~5-10 menit). EAS akan memberikan **Link Langsung (QR Code & URL) untuk mendownload file `.apk`** ke HP Anda!

---

### Opsi 2: Build Mandiri di Laptop (Local Build dengan Android SDK)
Jika laptop Anda memiliki Android Studio & JDK:
```bash
npx expo run:android --variant release
```
File APK akan berada di folder:
`android/app/build/outputs/apk/release/app-release.apk`
