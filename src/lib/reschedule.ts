import { SupabaseClient } from "@supabase/supabase-js";
import { generateFullSchedule } from "./schedule";
import dayjs from "dayjs";
import { getCurrentDay } from "./utils";

export const reschedule = async ({
  daysOfWeek,
  maxStudyPages,
  supabase,
  activeSemester,
}: {
  supabase: SupabaseClient;
  maxStudyPages: number;
  daysOfWeek: string[];
  activeSemester: Semester;
}) => {
  const now = getCurrentDay();
  const todayStr = dayjs(now, "Asia/Jakarta").format("YYYY-MM-DD");

  const { data: todaySchedules } = await supabase
    .from("daily_schedules")
    .select("status")
    .eq("semester_id", activeSemester.id)
    .eq("date", todayStr);

  let startGenerationDate = todayStr;

  if (todaySchedules && todaySchedules.length > 0) {
    // Jika statusnya BUKAN pending, berarti sudah dikerjakan / terlewat
    const isTodayUsed = todaySchedules.some(
      (s) => !["pending"].includes(s.status.toLowerCase()),
    );

    if (isTodayUsed) {
      // Geser tanggal mulai generate ke BESOK secara aman (Bypass Timezone Server)
      const dateObj = new Date(todayStr);
      dateObj.setUTCDate(dateObj.getUTCDate() + 1);
      startGenerationDate = dateObj.toISOString().split("T")[0];
    }
  }

  const { error: deleteError } = await supabase
    .from("daily_schedules")
    .delete()
    .eq("semester_id", activeSemester.id)
    .gte("date", todayStr)
    .in("status", ["pending", "critical"]);

  if (deleteError) {
    throw new Error(
      "Gagal menghapus jadwal lama untuk reschedule: " + deleteError.message,
    );
  }

  const { data: coursesData, error: coursesError } = await supabase
    .from("courses")
    .select("*, milestones(*)")
    .eq("semester_id", activeSemester.id);

  if (coursesError || !coursesData || coursesData.length === 0) {
    throw new Error(
      "Gagal mengambil data mata kuliah untuk reschedule: " +
        (coursesError?.message || "Tidak ada data"),
    );
  }

  const coursesInput = coursesData.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    title: c.title,
    credits: c.credits,
    page_count: c.page_count,
    exam_date: c.exam_date,
    color: c.color,
    completed_pages: c.milestones
      ? c.milestones.reduce(
          (acc: number, m: any) => acc + (m.readed_pages || 0),
          0,
        )
      : 0,
    created_at: c.created_at,
    updated_at: c.updated_at,
    milestones: c.milestones || [],
  }));

  const scheduleResult = generateFullSchedule({
    courses: coursesInput,
    daysOfWeek: daysOfWeek,
    kMaks: maxStudyPages,
    startDateInput: startGenerationDate,
  });

  if (scheduleResult.schedule && scheduleResult.schedule.length > 0) {
    const inserts: DailyScheduleInput[] = scheduleResult.schedule.map(
      (item) => ({
        semester_id: activeSemester.id,
        user_id: activeSemester.user_id,
        course_id: item.course.id,
        milestone_id: item.milestone.id,
        date: item.date,
        target_pages: item.total_pages,
        title: `${item.course.title}: ${item.total_pages} Halaman`,
        from_page: item.from_page,
        to_page: item.to_page,
        is_overload: item.is_overload,
        status: "pending",
      }),
    );

    const { error: insertError } = await supabase
      .from("daily_schedules")
      .insert(inserts);

    if (insertError) {
      throw new Error(
        "Gagal menyimpan jadwal baru ke database: " + insertError.message,
      );
    }
  }

  return scheduleResult;
};
