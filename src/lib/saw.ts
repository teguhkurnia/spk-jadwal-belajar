export interface CourseInput {
  id: string;
  title: string;
  exam_date: string;
  page_count: number;
  credits?: number;
  completed_pages?: number;
  color?: string;
}

export interface SAWWeights {
  w_time: number;
  w_pages: number;
}

export interface SAWRankingResult {
  rank: number;
  id: string;
  title: string;
  credits?: number;
  exam_date: string;
  page_count: number;
  completed_pages: number;
  remaining_days: number;
  remaining_pages: number;
  normalized_time: number;
  normalized_pages: number;
  priority_score: number; // V_i
  saw_portion_percent: number; // (V_i / Total V) * 100
  daily_quota_pages: number; // (V_i / Total V) * K_maks
}

export function calculateSAWPriority(
  courses: CourseInput[],
  weights: SAWWeights = { w_time: 0.5, w_pages: 0.5 },
  kMaks: number = 40,
  refDateInput?: string | Date
): {
  weights: SAWWeights;
  k_maks: number;
  total_v: number;
  criteria_min_max: { min_remaining_days: number; max_remaining_pages: number };
  data: SAWRankingResult[];
} {
  if (!courses || courses.length === 0) {
    return {
      weights,
      k_maks: kMaks,
      total_v: 0,
      criteria_min_max: { min_remaining_days: 0, max_remaining_pages: 0 },
      data: [],
    };
  }

  const refDate = refDateInput ? new Date(refDateInput) : new Date();
  refDate.setHours(0, 0, 0, 0);

  // 1. Hitung Cost (sisa waktu) dan Benefit (sisa halaman)
  const items = courses.map((course) => {
    const examDate = new Date(course.exam_date);
    examDate.setHours(0, 0, 0, 0);

    const diffMs = examDate.getTime() - refDate.getTime();
    const daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    // Sisa waktu minimal 1 hari agar tidak terjadi pembagian dengan nol
    const remaining_days = Math.max(1, daysDiff);

    const completed = course.completed_pages || 0;
    const remaining_pages = Math.max(0, course.page_count - completed);

    return {
      course,
      remaining_days,
      remaining_pages,
      completed_pages: completed,
    };
  });

  // 2. Normalisasi matriks: Min untuk Cost (waktu) dan Max untuk Benefit (halaman)
  const min_remaining_days = Math.min(...items.map((i) => i.remaining_days));
  const max_remaining_pages = Math.max(...items.map((i) => i.remaining_pages));

  const totalWeight = (weights.w_time || 0) + (weights.w_pages || 0);
  const normalizedWeights: SAWWeights =
    totalWeight > 0
      ? {
          w_time: weights.w_time / totalWeight,
          w_pages: weights.w_pages / totalWeight,
        }
      : { w_time: 0.5, w_pages: 0.5 };

  // Hitung V_i
  const tempRanked = items.map((item) => {
    const normalized_time =
      item.remaining_days > 0 ? min_remaining_days / item.remaining_days : 1;

    const normalized_pages =
      max_remaining_pages > 0 ? item.remaining_pages / max_remaining_pages : 0;

    const priority_score = Number(
      (
        normalizedWeights.w_time * normalized_time +
        normalizedWeights.w_pages * normalized_pages
      ).toFixed(4)
    );

    return {
      item,
      normalized_time,
      normalized_pages,
      priority_score,
    };
  });

  // Total nilai V dari semua matkul (Langkah 3)
  const total_v = Number(
    tempRanked.reduce((acc, curr) => acc + curr.priority_score, 0).toFixed(4)
  );

  // Distribusi kuota berdasarkan porsi V_i / Total V * K_maks
  const ranked: SAWRankingResult[] = tempRanked.map((t) => {
    const portion = total_v > 0 ? t.priority_score / total_v : 0;
    const saw_portion_percent = Number((portion * 100).toFixed(2));
    const rawQuota = portion * kMaks;
    const daily_quota_pages = Math.round(rawQuota);

    return {
      rank: 0,
      id: t.item.course.id,
      title: t.item.course.title,
      credits: t.item.course.credits,
      exam_date: t.item.course.exam_date,
      page_count: t.item.course.page_count,
      completed_pages: t.item.completed_pages,
      remaining_days: t.item.remaining_days,
      remaining_pages: t.item.remaining_pages,
      normalized_time: Number(t.normalized_time.toFixed(4)),
      normalized_pages: Number(t.normalized_pages.toFixed(4)),
      priority_score: t.priority_score,
      saw_portion_percent,
      daily_quota_pages,
    };
  });

  // Urutkan ranking tertinggi
  ranked.sort((a, b) => b.priority_score - a.priority_score);
  ranked.forEach((item, index) => {
    item.rank = index + 1;
  });

  return {
    weights: normalizedWeights,
    k_maks: kMaks,
    total_v,
    criteria_min_max: {
      min_remaining_days,
      max_remaining_pages,
    },
    data: ranked,
  };
}