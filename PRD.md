# Product Requirements Document (PRD)

**Project Name:** Sistem Pendukung Keputusan (SPK) Penjadwalan Belajar Mandiri Terintegrasi dengan Pendekatan Milestone Tugas dan Auto-Reschedule.
**Target Case Study:** Mahasiswa Universitas Terbuka (UT).

## 1. Product Overview

### 1.1 Latar Belakang & Masalah

Mahasiswa Universitas Terbuka (UT) menerapkan sistem Pendidikan Jarak Jauh (PJJ) yang menuntut kemandirian tinggi. Permasalahan utama yang sering terjadi adalah **prokrastinasi akademik** karena tebalnya Buku Materi Pokok (BMP/Modul) dan keterbatasan waktu (mayoritas mahasiswa adalah pekerja). Aplikasi _to-do list_ statis eksisting gagal memecahkan masalah karena jika target harian terlewat, beban belajar akan menumpuk di akhir semester tanpa ada penyesuaian otomatis.

### 1.2 Solusi & Visi

Aplikasi web cerdas (Asisten Akademik) yang mampu menyusun jadwal belajar harian secara dinamis. Sistem membagi target beban bacaan berdasarkan _Milestone_ Tugas (Tuton 1, 2, 3, dan UAS), memilih prioritas mata kuliah menggunakan **Algoritma SAW**, dan mendistribusikan beban halaman menggunakan metode **Alokasi Proporsional (Pacing)** ke hari-hari efektif yang dipilih pengguna.

## 2. Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS.
- **Backend/API:** Next.js API Routes (Serverless Functions).
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth).
- **Automation:** Vercel Cron / Supabase pg_cron (untuk fitur Auto-Reschedule harian).

## 3. Core Algorithms (The "Brain")

Sistem menggunakan pendekatan **"1 Hari 1 Matkul (Winner-Takes-All)"** dengan _Full-Term Simulation_. Logika terletak pada `schedule.ts`.

### 3.1 Algoritma Simple Additive Weighting (SAW)

Menentukan mata kuliah mana yang paling mendesak di suatu hari.

- **C1 (Cost):** Sisa hari efektif menuju _deadline_ milestone terdekat. (Makin kecil = makin prioritas).
- **C2 (Benefit):** Sisa beban bacaan (halaman) milestone terdekat. (Makin besar = makin prioritas).
- **C3 (Benefit):** Bobot SKS Mata Kuliah. (Makin besar = makin prioritas).

### 3.2 Alokasi Proporsional (Just-in-Time Pacing) & Overload Validation

- Setelah SAW menetapkan 1 Matkul pemenang di hari tersebut, sistem menghitung kecepatan ideal membaca:
  `Target Aktual = Math.min(Kapasitas_Maks, Math.ceil(Sisa_Halaman / Sisa_Hari_Efektif))`
- **Validasi Overload:** Sistem mengecek `Target Aktual` dari seluruh matkul aktif. Jika kecepatan minimal yang dibutuhkan lebih besar dari `Kapasitas Maksimal ($K_{maks}$)` mahasiswa, sistem memicu status **"Kritis"** (_Overload Risk_).

## 4. Key Features

1. **Onboarding & Preferensi Belajar:** Pengguna mengatur Kapasitas Maksimal halaman per hari ($K_{maks}$) dan Ketersediaan Hari Belajar (contoh: hanya Sabtu-Minggu).
2. **Pendekatan Milestone Tugas:** Target bacaan tidak dibagi rata sampai UAS, melainkan difokuskan ke _deadline_ terdekat (Tuton 1 di Minggu ke-3, Tuton 2 di Minggu ke-5, dst).
3. **Full Schedule Generation:** Sistem memprediksi dan me- _generate_ seluruh jadwal dari hari pertama sampai seluruh materi semester tamat dalam satu _array_ berurutan.
4. **Auto-Reschedule (Cron Job):** Mengecek status jadwal kemarin. Jika "Pending", ubah ke "Terlewat" dan picu hitung ulang jadwal untuk hari ini hingga akhir semester.
5. **Overload Alert:** _Banner_ peringatan dini jika kapasitas belajar mahasiswa tidak mampu mengejar _deadline_ (status "Kritis").
