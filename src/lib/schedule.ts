export interface ScheduleDayItem {
  date: string;
  day_name: string;
  total_pages: number;
  from_page: number;
  to_page: number;
  milestone: Milestone;
  course: Course;
}

const DAYS_OF_WEEK = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export function isDayActive(date: Date, activeDays: string[]): boolean {
  if (!activeDays || activeDays.length === 0) return true; // If no active days specified, consider all days as active
  const dayName = DAYS_OF_WEEK[date.getDay()];
  return activeDays.includes(dayName);
}

export function countEffectiveDays(
  startDate: Date,
  endDateStr: string,
  daysOfWeek: string[],
): number {
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const target = new Date(endDateStr);
  target.setHours(0, 0, 0, 0);

  let count = 0;
  while (cur <= target) {
    if (isDayActive(cur, daysOfWeek)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function generateFullSchedule(params: {
  courses: CourseWithMilestones[];
  daysOfWeek: string[]; // Contoh: ["Sabtu", "Minggu"]
  kMaks: number; // Contoh: 40
  startDateInput?: string | Date;
  weights?: { w_time: number; w_pages: number; w_sks: number };
}) {
  const {
    courses,
    daysOfWeek,
    kMaks,
    startDateInput,
    weights = { w_time: 0.5, w_pages: 0.35, w_sks: 0.15 },
  } = params;

  let hasOverloadRisk = false;
  const schedule: ScheduleDayItem[] = [];

  const currentDate = startDateInput ? new Date(startDateInput) : new Date();
  currentDate.setHours(0, 0, 0, 0);

  // 1. Buat Tracker (Kloning data agar bisa disimulasikan pengurangannya tanpa merusak data asli)
  const trackers = courses.map((c) => ({
    ...c,
    running_completed_pages: c.completed_pages || 0,
    milestones: c.milestones.map((m) => ({
      ...m,
      remaining_pages: m.target_pages - m.readed_pages,
    })),
  }));

  // Fungsi internal mencari milestone terdekat yang belum tamat
  const getActiveMilestone = (courseTracker: (typeof trackers)[0]) => {
    return courseTracker.milestones.find((m) => m.remaining_pages > 0) || null;
  };

  // Batas aman loop untuk mencegah infinite loop (Maksimal simulasi 365 hari)
  let failsafe = 0;

  // 2. Looping Hari demi Hari sampai SEMUA halaman habis
  while (failsafe < 365) {
    // Cek apakah masih ada matkul yang milestonenya belum selesai
    const activeCourses = trackers.filter(
      (c) => getActiveMilestone(c) !== null,
    );

    // Jika semua milestone sudah 0 halamannya, HENTIKAN simulasi (Jadwal Tamat!)
    if (activeCourses.length === 0) {
      break;
    }

    // Hanya lakukan perhitungan jika hari ini adalah Hari Efektif Belajar
    if (isDayActive(currentDate, daysOfWeek)) {
      const decisionMatrix = activeCourses.map((c) => {
        const m = getActiveMilestone(c)!;
        const effDaysLeft = countEffectiveDays(
          currentDate,
          m.deadline,
          daysOfWeek,
        );
        return {
          id: c.id,
          c1_daysLeft: Math.max(1, effDaysLeft), // Cost: Sisa hari ujian
          c2_pagesLeft: m.remaining_pages, // Benefit: Sisa beban bacaan
          c3_sks: c.credits, // Benefit: SKS matkul
        };
      });

      // Normalisasi
      const minC1 = Math.min(...decisionMatrix.map((d) => d.c1_daysLeft));
      const maxC2 = Math.max(...decisionMatrix.map((d) => d.c2_pagesLeft));
      const maxC3 = Math.max(...decisionMatrix.map((d) => d.c3_sks));

      // Hitung Preferensi (V)
      const sawScores = decisionMatrix.map((d) => {
        const r1 = minC1 / d.c1_daysLeft;
        const r2 = d.c2_pagesLeft / maxC2;
        const r3 = d.c3_sks / maxC3;
        const v =
          weights.w_time * r1 + weights.w_pages * r2 + weights.w_sks * r3;
        return { id: d.id, v };
      });

      sawScores.sort((a, b) => b.v - a.v);

      const winningCourseId = sawScores[0].id;
      const winningTracker = activeCourses.find(
        (c) => c.id === winningCourseId,
      )!;
      const winningMilestone = getActiveMilestone(winningTracker)!;

      const effDaysLeftWinner = countEffectiveDays(
        currentDate,
        winningMilestone.deadline,
        daysOfWeek,
      );

      const idealPacing =
        effDaysLeftWinner > 0
          ? Math.ceil(winningMilestone.remaining_pages / effDaysLeftWinner)
          : winningMilestone.remaining_pages;

      const actualTarget = Math.min(kMaks, idealPacing);

      const dailyScheduleItems: ScheduleDayItem[] = [];

      // Validasi Overload untuk SEMUA matkul aktif (walaupun bukan pemenang)
      activeCourses.forEach((c) => {
        const m = getActiveMilestone(c)!;
        const effDaysLeft = countEffectiveDays(
          currentDate,
          m.deadline,
          daysOfWeek,
        );

        // Target kecepatan minimal yang diperlukan untuk selamat sampai deadline
        const minRequired =
          effDaysLeft > 0 ? m.remaining_pages / effDaysLeft : m.remaining_pages;
        let status: "Aman" | "Kritis" = "Aman";

        if (c.id === winningCourseId) {
          // Jika pemenang, cek apakah kecepatan belajarnya cukup memadai
          if (actualTarget < minRequired) status = "Kritis";

          const fromPage = c.running_completed_pages + 1;
          const toPage = c.running_completed_pages + actualTarget;

          const { milestones, running_completed_pages, ...courseData } = c;

          dailyScheduleItems.push({
            date: currentDate.toISOString().split("T")[0],
            day_name: DAYS_OF_WEEK[currentDate.getDay()],
            total_pages: actualTarget,
            from_page: fromPage,
            to_page: toPage,
            milestone: winningMilestone,
            course: courseData,
          });
        } else {
          // Jika matkul kalah antrean, cek apakah ia sudah keburu tenggelam (kritis)
          if (minRequired > kMaks) status = "Kritis";
        }

        // Jika ada satu saja yang kritis, trigger warning global
        if (status === "Kritis") hasOverloadRisk = true;
      });

      // Kurangi beban Pemenang (seolah-olah mahasiswa sudah belajar hari ini)
      winningMilestone.remaining_pages -= actualTarget;
      winningTracker.running_completed_pages += actualTarget;

      schedule.push(...dailyScheduleItems);
    }

    // Maju ke hari berikutnya
    currentDate.setDate(currentDate.getDate() + 1);
    failsafe++;
  }

  // Pesan peringatan global jika ada minimal 1 hari yang kritis
  const warning_notification = hasOverloadRisk
    ? `Peringatan: Jadwal belajar Anda berstatus KRITIS. Kapasitas ${kMaks} halaman/hari tidak cukup untuk mengejar beberapa milestone Tuton/UAS. Mohon tambah hari aktif belajar.`
    : null;

  return {
    k_maks: kMaks,
    has_overload_risk: hasOverloadRisk,
    warning_notification,
    total_hari_belajar: schedule.length,
    schedule: schedule, // Array lengkap jadwal dari hari pertama sampai tamat
  };
}
