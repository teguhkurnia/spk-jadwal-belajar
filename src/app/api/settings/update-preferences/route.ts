import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateFullSchedule } from "@/lib/schedule";

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
        { status: 401 }
      );
    }

    const body = await request.json();
    const { max_study_pages, days_of_week } = body;

    if (max_study_pages === undefined || !days_of_week || !Array.isArray(days_of_week)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload: max_study_pages and days_of_week are required." },
        { status: 400 }
      );
    }

    // 1. Get active semester
    const { data: activeSemester, error: semError } = await supabase
      .from("semesters")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (semError || !activeSemester) {
      return NextResponse.json(
        { success: false, message: "No active semester found." },
        { status: 404 }
      );
    }

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
        { status: 500 }
      );
    }

    // 3. DELETE future daily schedules that haven't happened yet (status in 'pending', 'critical')
    // Or simply delete pending/critical for this semester_id
    const { error: deleteError } = await supabase
      .from("daily_schedules")
      .delete()
      .eq("semester_id", activeSemester.id)
      .in("status", ["pending", "critical"]);

    if (deleteError) {
      console.error("Error deleting future schedules:", deleteError);
    }

    // 4. Fetch Snapshot: courses with milestones and completed pages
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("*, milestones(*)")
      .eq("semester_id", activeSemester.id);

    if (coursesError || !coursesData || coursesData.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Preferences updated, but no courses found to generate schedule.",
      });
    }

    // Prepare courses input for generateFullSchedule
    const coursesInput: CourseWithMilestones[] = coursesData.map((c) => ({
      id: c.id,
      user_id: c.user_id,
      title: c.title,
      credits: c.credits,
      page_count: c.page_count,
      exam_date: c.exam_date,
      color: c.color,
      completed_pages: c.milestones
        ? c.milestones.reduce((acc: number, m: any) => acc + (m.readed_pages || 0), 0)
        : 0,
      created_at: c.created_at,
      updated_at: c.updated_at,
      milestones: c.milestones || [],
    }));

    // Today's date string ISO (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split("T")[0];

    const scheduleResult = generateFullSchedule({
      courses: coursesInput,
      daysOfWeek: days_of_week,
      kMaks: max_study_pages,
      startDateInput: todayStr,
    });

    // 5. Bulk insert new schedule into daily_schedules
    if (scheduleResult.schedule && scheduleResult.schedule.length > 0) {
      const inserts = scheduleResult.schedule.map((item: any) => ({
        semester_id: activeSemester.id,
        user_id: user.id,
        course_id: item.course.id,
        milestone_id: item.milestone?.id || null,
        date: item.date,
        target_pages: item.total_pages,
        status: "pending" as const,
      }));

      // Insert in chunks of 500 if needed, or all at once
      const { error: insertError } = await supabase
        .from("daily_schedules")
        .insert(inserts);

      if (insertError) {
        console.error("Error inserting generated schedule:", insertError);
        return NextResponse.json(
          { success: false, message: "Preferences updated, but failed to save new schedule: " + insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      has_overload_risk: scheduleResult.has_overload_risk,
      warning: scheduleResult.warning_notification,
      message: "Jadwal berhasil disusun ulang.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
