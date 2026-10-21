import { reschedule } from "@/lib/reschedule";
import { getCurrentDay } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: Request) {
  try {
    const now = getCurrentDay();
    const todayStr = dayjs(now, "Asia/Jakarta").format("YYYY-MM-DD");

    // Ubah semua jadwal kemarin yang belum dikerjakan menjadi "Terlewat"
    const { error: updateError, data: updatedSchedules } = await supabase
      .from("daily_schedules")
      .update({ status: "overdue" })
      .lt("date", todayStr)
      .in("status", ["pending"])
      .select("semester_id"); // Select updated rows for logging

    if (updateError)
      throw new Error("Gagal menandai jadwal terlewat: " + updateError.message);

    if (!updatedSchedules || updatedSchedules.length === 0) {
      return NextResponse.json({
        success: true,
        message:
          "Tidak ada jadwal overdue. Penjadwalan ulang dilewati untuk menghemat resource.",
      });
    }

    const affectedSemesterIds = Array.from(
      new Set(updatedSchedules.map((s) => s.semester_id)),
    );

    // Kita hanya perlu menghitung ulang jadwal mahasiswa yang semesternya sedang aktif
    const { data: activeSemesters, error: semesterError } = await supabase
      .from("semesters")
      .select("*")
      .eq("is_active", true)
      .in("id", affectedSemesterIds);

    if (semesterError)
      throw new Error(
        "Gagal mengambil semester aktif: " + semesterError.message,
      );
    if (!activeSemesters || activeSemesters.length === 0) {
      return NextResponse.json({
        message: "Tidak ada semester aktif untuk di-reschedule.",
      });
    }

    let rescheduledCount = 0;

    for (const semester of activeSemesters) {
      try {
        await reschedule({
          supabase,
          activeSemester: semester,
          daysOfWeek: semester.days_of_week,
          maxStudyPages: semester.max_study_pages,
        });

        rescheduledCount++;
      } catch (error) {
        console.error(
          `Gagal melakukan reschedule untuk semester ${semester.id}:`,
          error,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-Reschedule berhasil dieksekusi. Total ${rescheduledCount} semester diperbarui.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
