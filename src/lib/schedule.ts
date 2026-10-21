import dayjs from "dayjs";

export interface ScheduleDayItem {
  date: string;
  day_name: string;
  total_pages: number;
  from_page: number;
  to_page: number;
  milestone: Milestone;
  course: Course;
  is_overload: boolean; // Menandai jika hari ini berisiko overload
}

export interface SawWeights {
  w_time: number;
  w_pages: number;
  w_sks: number;
}

export interface GenerateScheduleParams {
  courses: CourseWithMilestones[];
  daysOfWeek: string[];
  kMaks: number;
  startDateInput?: string | Date;
  weights?: SawWeights;
}

type MilestoneTracker = Milestone & { remaining_pages: number };

type CourseTracker = Omit<CourseWithMilestones, "milestones"> & {
  running_completed_pages: number;
  milestones: MilestoneTracker[];
};

interface DayPlan {
  items: ScheduleDayItem[];
  targetPages: number;
  hasOverloadRisk: boolean;
}

const DAYS_OF_WEEK = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

const DEFAULT_WEIGHTS: SawWeights = {
  w_time: 0.5,
  w_pages: 0.35,
  w_sks: 0.15,
};

// Batas aman loop untuk mencegah infinite loop (Maksimal simulasi 365 hari)
const MAX_SIMULATION_DAYS = 365;

/**
 * Memeriksa apakah tanggal tertentu merupakan hari efektif belajar berdasarkan preferensi hari aktif.
 */
export function isDayActive(date: Date, activeDays: string[]): boolean {
  if (!activeDays || activeDays.length === 0) return true;
  const dayName = DAYS_OF_WEEK[date.getDay()];
  return activeDays.includes(dayName);
}

/**
 * Menghitung jumlah hari efektif antara tanggal mulai dan tenggat waktu (deadline).
 */
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

/**
 * Clones the courses into trackers so reading progress can be simulated
 * without mutating the original data.
 */
const createTrackers = (courses: CourseWithMilestones[]): CourseTracker[] =>
  courses.map((c) => ({
    ...c,
    running_completed_pages: c.completed_pages || 0,
    milestones: c.milestones.map((m) => ({
      ...m,
      remaining_pages: m.target_pages - m.readed_pages,
    })),
  }));

/**
 * Returns the nearest milestone that still has pages left, or null if finished.
 */
const getActiveMilestone = (
  courseTracker: CourseTracker,
): MilestoneTracker | null =>
  courseTracker.milestones.find((m) => m.remaining_pages > 0) || null;

/**
 * Returns all courses that still have an unfinished milestone.
 */
const getActiveCourses = (trackers: CourseTracker[]): CourseTracker[] =>
  trackers.filter((c) => getActiveMilestone(c) !== null);

/**
 * Minimum pages per day needed to meet the milestone deadline.
 * The remaining effective days are divided by the number of active courses
 * to get this course's "session quota".
 */
const getMinRequiredPages = (
  milestone: MilestoneTracker,
  effDaysLeft: number,
  activeCourseCount: number,
): number => {
  // Sisa hari dibagi dengan jumlah matkul aktif untuk mencari "Jatah Hari" matkul ini
  const estimatedSessions = Math.max(1, effDaysLeft / activeCourseCount);

  return effDaysLeft > 0
    ? milestone.remaining_pages / estimatedSessions
    : milestone.remaining_pages;
};

/**
 * Ranks active courses with the SAW method and returns the winner for today.
 */
const selectWinningCourse = ({
  activeCourses,
  currentDate,
  daysOfWeek,
  weights,
}: {
  activeCourses: CourseTracker[];
  currentDate: Date;
  daysOfWeek: string[];
  weights: SawWeights;
}): CourseTracker => {
  const decisionMatrix = activeCourses.map((c) => {
    const m = getActiveMilestone(c)!;
    const effDaysLeft = countEffectiveDays(
      currentDate,
      dayjs(m.deadline).subtract(1, "day").format("YYYY-MM-DD"),
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
    const v = weights.w_time * r1 + weights.w_pages * r2 + weights.w_sks * r3;
    return { id: d.id, v };
  });

  sawScores.sort((a, b) => b.v - a.v);

  return activeCourses.find((c) => c.id === sawScores[0].id)!;
};

/**
 * Calculates how many pages the winning course should study today:
 * the ideal pacing, capped by the daily maximum (K_Maks).
 */
const calculateDailyTarget = ({
  milestone,
  effDaysLeft,
  activeCourseCount,
  kMaks,
}: {
  milestone: MilestoneTracker;
  effDaysLeft: number;
  activeCourseCount: number;
  kMaks: number;
}): number => {
  // Pacing Ideal = Sisa Halaman dibagi Estimasi Sesi (bukan sisa hari total)
  const minRequired = getMinRequiredPages(
    milestone,
    effDaysLeft,
    activeCourseCount,
  );
  const idealPacing = effDaysLeft > 0 ? Math.ceil(minRequired) : minRequired;

  // Target aktual adalah kecepatan ideal, tapi tidak boleh menembus K_Maks
  return Math.min(kMaks, idealPacing);
};

/**
 * Builds the schedule item for the winning course on the given date.
 */
const buildScheduleItem = ({
  winner,
  milestone,
  currentDate,
  targetPages,
  isOverload,
}: {
  winner: CourseTracker;
  milestone: MilestoneTracker;
  currentDate: Date;
  targetPages: number;
  isOverload: boolean;
}): ScheduleDayItem => {
  const { milestones, running_completed_pages, ...courseData } = winner;

  return {
    date: dayjs(currentDate).format("YYYY-MM-DD"),
    day_name: DAYS_OF_WEEK[currentDate.getDay()],
    total_pages: targetPages,
    from_page: running_completed_pages + 1,
    to_page: running_completed_pages + targetPages,
    milestone,
    course: courseData as any,
    is_overload: isOverload,
  };
};

/**
 * Plans a single study day: decides today's target for the winner,
 * builds its schedule item, and checks overload risk for ALL active courses.
 */
const planDay = ({
  activeCourses,
  winner,
  currentDate,
  daysOfWeek,
  kMaks,
}: {
  activeCourses: CourseTracker[];
  winner: CourseTracker;
  currentDate: Date;
  daysOfWeek: string[];
  kMaks: number;
}): DayPlan => {
  const winningMilestone = getActiveMilestone(winner)!;
  const effDaysLeftWinner = countEffectiveDays(
    currentDate,
    dayjs(winningMilestone.deadline).subtract(1, "day").format("YYYY-MM-DD"),
    daysOfWeek,
  );

  const targetPages = calculateDailyTarget({
    milestone: winningMilestone,
    effDaysLeft: effDaysLeftWinner,
    activeCourseCount: activeCourses.length,
    kMaks,
  });

  const items: ScheduleDayItem[] = [];
  let hasOverloadRisk = false;

  // Validasi Overload untuk SEMUA matkul aktif
  activeCourses.forEach((c) => {
    const m = getActiveMilestone(c)!;
    const effDaysLeft = countEffectiveDays(
      currentDate,
      dayjs(m.deadline).subtract(1, "day").format("YYYY-MM-DD"),
      daysOfWeek,
    );

    // Validasi juga menggunakan Estimasi Sesi agar akurat
    const minRequired = getMinRequiredPages(
      m,
      effDaysLeft,
      activeCourses.length,
    );

    let isCritical = false;

    if (c.id === winner.id) {
      // Jika pemenang, cek apakah target harian ini cukup untuk mengejar deadline
      isCritical = targetPages < minRequired;

      items.push(
        buildScheduleItem({
          winner,
          milestone: winningMilestone,
          currentDate,
          targetPages,
          isOverload: isCritical,
        }),
      );
    } else {
      // Jika matkul kalah antrean, cek apakah kebutuhan halamannya sudah melampaui K_Maks
      isCritical = minRequired > kMaks;
    }

    if (isCritical) hasOverloadRisk = true;
  });

  return { items, targetPages, hasOverloadRisk };
};

/**
 * Reduces the winner's remaining pages, as if the student studied today.
 */
const applyStudyProgress = (
  winner: CourseTracker,
  targetPages: number,
): void => {
  const winningMilestone = getActiveMilestone(winner)!;
  winningMilestone.remaining_pages -= targetPages;
  winner.running_completed_pages += targetPages;
};

/**
 * Builds the global warning message if at least one day is critical.
 */
const buildWarningNotification = (
  hasOverloadRisk: boolean,
  kMaks: number,
): string | null =>
  hasOverloadRisk
    ? `Warning: Your study schedule is CRITICAL. A capacity of ${kMaks} pages/day is not enough to meet several tutorial/final exam milestones. Please add more active study days.`
    : null;

/**
 * Menghasilkan jadwal belajar lengkap dari hari pertama hingga semua milestone selesai menggunakan metode SAW.
 */
export function generateFullSchedule(params: GenerateScheduleParams) {
  const {
    courses,
    daysOfWeek,
    kMaks,
    startDateInput,
    weights = DEFAULT_WEIGHTS,
  } = params;

  let hasOverloadRisk = false;
  const schedule: ScheduleDayItem[] = [];

  const currentDate = startDateInput ? new Date(startDateInput) : new Date();
  currentDate.setHours(0, 0, 0, 0);

  const trackers = createTrackers(courses);

  // Looping Hari demi Hari sampai SEMUA halaman habis
  let failsafe = 0;
  while (failsafe < MAX_SIMULATION_DAYS) {
    const activeCourses = getActiveCourses(trackers);

    // Jika semua milestone sudah 0 halamannya, HENTIKAN simulasi (Jadwal Tamat!)
    if (activeCourses.length === 0) break;

    // Hanya lakukan perhitungan jika hari ini adalah Hari Efektif Belajar
    if (isDayActive(currentDate, daysOfWeek)) {
      const winner = selectWinningCourse({
        activeCourses,
        currentDate,
        daysOfWeek,
        weights,
      });

      const dayPlan = planDay({
        activeCourses,
        winner,
        currentDate,
        daysOfWeek,
        kMaks,
      });

      // Kurangi beban Pemenang (seolah-olah mahasiswa sudah belajar hari ini)
      applyStudyProgress(winner, dayPlan.targetPages);

      schedule.push(...dayPlan.items);
      if (dayPlan.hasOverloadRisk) hasOverloadRisk = true;
    }

    // Maju ke hari berikutnya
    currentDate.setDate(currentDate.getDate() + 1);
    failsafe++;
  }

  return {
    k_maks: kMaks,
    has_overload_risk: hasOverloadRisk,
    warning_notification: buildWarningNotification(hasOverloadRisk, kMaks),
    total_study_days: schedule.length,
    schedule,
  };
}
