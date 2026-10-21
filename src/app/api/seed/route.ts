import { milestone } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const courses = [
  {
    title: "Pengantar Sains Data",
    credits: 3,
    page_count: 440,
    exam_date: "2026-12-05",
    color: "#3b82f6",
    milestones: {
      "1": 171,
      "2": 140,
      "3": 114,
    },
  },
  {
    title: "Manajemen Resiko dan Audit Sistem Informasi",
    credits: 3,
    page_count: 494,
    exam_date: "2026-12-16",
    color: "#f59e0b",
    milestones: {
      "1": 160,
      "2": 158,
      "3": 157,
    },
  },
  {
    title: "Tata Kelola Teknologi Informasi",
    credits: 2,
    page_count: 306,
    exam_date: "2026-12-12",
    color: "#10b981",
    milestones: {
      "1": 96,
      "2": 93,
      "3": 101,
    },
  },
  {
    title: "Keamanan Jaringan",
    credits: 3,
    page_count: 388,
    exam_date: "2026-12-13",
    color: "#ef4444",
    milestones: {
      "1": 129,
      "2": 131,
      "3": 110,
    },
  },
];

export const GET = async () => {
  try {
    const supabase = createClient(await cookies());
    const userId = await supabase.auth
      .getUser()
      .then(({ data: { user } }) => user?.id);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 },
      );
    }

    const currentSemester = await supabase
      .from("semesters")
      .select("*")
      .order("created_at", { ascending: false })
      .eq("is_active", true)
      .eq("user_id", userId)
      .single();

    const tutonDate = currentSemester.data.start_tuton_date;

    for (const course of courses) {
      const milestones = [
        {
          title: "Tuton 1",
          target_pages: course.milestones["1"],
          deadline: milestone(tutonDate, 3),
        },
        {
          title: "Tuton 2",
          target_pages: course.milestones["2"],
          deadline: milestone(tutonDate, 5),
        },
        {
          title: "Tuton 3",
          target_pages: course.milestones["3"],
          deadline: milestone(tutonDate, 7),
        },
      ].filter((m) => m.target_pages > 0);

      const { error, data } = await supabase
        .from("courses")
        .insert({
          user_id: userId,
          semester_id: currentSemester.data.id,
          title: course.title,
          credits: Number(course.credits),
          page_count: Number(course.page_count),
          exam_date: course.exam_date,
          color: course.color,
        })
        .select("id");

      if (data && data.length > 0) {
        const courseId = data[0].id;
        const milestoneInsertData: MilestoneInput[] = milestones.map((m) => ({
          user_id: userId,
          semester_id: currentSemester.data.id,
          course_id: courseId,
          deadline: m.deadline?.toISOString().split("T")[0] ?? "",
          target_pages: m.target_pages,
          title: m.title,
        }));

        const { error: milestoneError } = await supabase
          .from("milestones")
          .insert(milestoneInsertData);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data seeded successfully",
        data: { courses, milestones: courses.flatMap((c) => c.milestones) },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error seeding data:", error);
    return new NextResponse(
      JSON.stringify({ success: false, message: "Error seeding data" }),
      { status: 500 },
    );
  }
};
