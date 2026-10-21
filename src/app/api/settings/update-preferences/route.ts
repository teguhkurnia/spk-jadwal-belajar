import { reschedule } from "@/lib/reschedule";
import { getActiveSemester } from "@/lib/semester";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient(await cookies());
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { max_study_pages, days_of_week } = body;

    if (
      max_study_pages === undefined ||
      !days_of_week ||
      !Array.isArray(days_of_week)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid payload: max_study_pages and days_of_week are required.",
        },
        { status: 400 },
      );
    }

    // 1. Get active semester
    const activeSemester = await getActiveSemester({
      supabase,
      userId: user.id,
    });

    // 2. Update max_study_pages and days_of_week in semesters
    const { error: updateError } = await supabase
      .from("semesters")
      .update({
        max_study_pages,
        days_of_week,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeSemester.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message },
        { status: 500 },
      );
    }

    const rescheduleResult = await reschedule({
      activeSemester,
      daysOfWeek: days_of_week,
      maxStudyPages: max_study_pages,
      supabase,
    });

    return NextResponse.json({
      success: true,
      has_overload_risk: rescheduleResult.has_overload_risk,
      warning: rescheduleResult.warning_notification,
      message: "Jadwal berhasil disusun ulang mulai hari ini.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
