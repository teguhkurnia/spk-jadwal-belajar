import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { calculateSAWPriority, CourseInput, SAWWeights } from "@/lib/saw";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kMaksParam = searchParams.get("k_maks");

    const supabase = createClient(await cookies());
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login or use POST." },
        { status: 401 }
      );
    }

    // Fetch user preferences for max_study_pages (k_maks)
    const { data: prefData } = await supabase
      .from("user_preferences")
      .select("max_study_pages")
      .eq("user_id", user.id)
      .single();

    const kMaks = kMaksParam
      ? Number(kMaksParam)
      : prefData?.max_study_pages || 40;

    const { data: coursesData, error } = await supabase
      .from("courses")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    const courses: CourseInput[] = (coursesData || []).map((c) => ({
      id: c.id,
      title: c.title,
      exam_date: c.exam_date,
      page_count: c.page_count || 100,
      credits: c.credits,
      completed_pages: c.completed_pages || 0,
      color: c.color,
    }));

    const result = calculateSAWPriority(courses, { w_time: 0.5, w_pages: 0.5 }, kMaks);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const courses: CourseInput[] = body.courses;
    const weights: SAWWeights | undefined = body.weights;
    const kMaks: number = body.k_maks || 40;
    const refDate: string | undefined = body.start_date;

    if (!courses || !Array.isArray(courses)) {
      return NextResponse.json(
        { success: false, message: "Valid courses array is required in body." },
        { status: 400 }
      );
    }

    const result = calculateSAWPriority(courses, weights, kMaks, refDate);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}