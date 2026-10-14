import { generateFullSchedule } from "@/lib/schedule";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("start_date");

    const supabase = createClient(await cookies());
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login or use POST." },
        { status: 401 },
      );
    }

    // Fetch preferences
    const { data: prefData } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Fetch courses
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("*, milestones(*)") // Fetch milestones if needed
      .eq("user_id", user.id);

    if (coursesError || !coursesData || coursesData.length === 0) {
      return NextResponse.json(
        { success: false, message: "No courses found to schedule." },
        { status: 404 },
      );
    }

    const coursesInput: CourseWithMilestones[] = coursesData.map((c) => ({
      id: c.id,
      title: c.title,
      exam_date: c.exam_date,
      page_count: c.page_count || 100,
      credits: c.credits,
      completed_pages: c.completed_pages || 0,
      color: c.color,
      user_id: c.user_id,
      milestones: c.milestones || [],
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));

    const result = generateFullSchedule({
      courses: coursesInput,
      daysOfWeek: prefData?.days_of_week || [
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
      ],
      kMaks: prefData?.max_study_pages || 40,
      startDateInput: startDateParam || undefined,
    });

    return NextResponse.json({
      success: true,
      preferences: {
        active_days: prefData?.days_of_week,
        max_study_pages: prefData?.max_study_pages || 40,
      },
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courses, preferences, k_maks, days_of_week, start_date } = body;

    if (!courses || !Array.isArray(courses)) {
      return NextResponse.json(
        { success: false, message: "Invalid or empty courses array provided." },
        { status: 400 },
      );
    }

    const activeDays =
      days_of_week || preferences?.active_days || preferences?.days_of_week;
    const capacityMaks =
      k_maks || preferences?.max_study_pages || preferences?.k_maks || 40;

    const result = generateFullSchedule({
      courses,
      daysOfWeek: activeDays,
      kMaks: capacityMaks,
      startDateInput: start_date,
    });

    return NextResponse.json({
      success: true,
      preferences: {
        active_days: activeDays,
        max_study_pages: capacityMaks,
      },
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
