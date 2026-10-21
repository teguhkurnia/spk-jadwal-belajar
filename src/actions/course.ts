"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { milestone } from "@/lib/utils";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { reschedule } from "@/lib/reschedule";
import { courseSchema } from "./type";

export type AddCourseState = {
  error?: string;
  success?: boolean;
};

export async function addCourse(
  _prev: AddCourseState,
  formData: FormData,
): Promise<AddCourseState> {
  const raw = {
    title: formData.get("title") as string,
    credits: Number(formData.get("credits")),
    pageCount: Number(formData.get("pageCount")),
    examDate: formData.get("examDate") as string,
    color: formData.get("color") as string,
    milestone1: Number(formData.get("milestone1")),
    milestone2: Number(formData.get("milestone2")),
    milestone3: Number(formData.get("milestone3")),
  };

  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const values = parsed.data;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Anda belum terautentikasi." };
  }

  const currentSemester = await supabase
    .from("semesters")
    .select("*")
    .order("created_at", { ascending: false })
    .eq("is_active", true)
    .single();

  if (currentSemester.error || !currentSemester.data) {
    return { error: "Tidak dapat menemukan semester aktif." };
  }

  const tutonDate = currentSemester.data.start_tuton_date;

  const milestones = [
    {
      title: "Tuton 1",
      target_pages: values.milestone1,
      deadline: milestone(tutonDate, 3),
    },
    {
      title: "Tuton 2",
      target_pages: values.milestone2,
      deadline: milestone(tutonDate, 5),
    },
    {
      title: "Tuton 3",
      target_pages: values.milestone3,
      deadline: milestone(tutonDate, 7),
    },
  ].filter((m) => m.target_pages > 0);

  const { error, data } = await supabase
    .from("courses")
    .insert({
      user_id: user.id,
      semester_id: currentSemester.data.id,
      title: values.title,
      credits: values.credits,
      page_count: values.pageCount,
      exam_date: values.examDate,
      color: values.color,
    })
    .select("id");

  if (error) return { error: error.message };

  if (data && data.length > 0) {
    const courseId = data[0].id;
    const { error: milestoneError } = await supabase.from("milestones").insert(
      milestones.map((m) => ({
        user_id: user.id,
        course_id: courseId,
        title: m.title,
        target_pages: m.target_pages,
        deadline: m.deadline!,
        semester_id: currentSemester.data.id,
      })),
    );

    if (milestoneError) return { error: milestoneError.message };
  }

  // Reschedule dailt schedules after adding a new course and its milestones
  await reschedule({
    supabase,
    activeSemester: currentSemester.data,
    daysOfWeek: currentSemester.data.days_of_week,
    maxStudyPages: currentSemester.data.max_study_pages,
  });

  revalidatePath("/", "layout");
  revalidatePath("/courses");
  revalidatePath("/calendar");
  return { success: true };
}

export async function deleteCourse(courseId: string): Promise<AddCourseState> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Anda belum terautentikasi." };
  }

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Reschedule dailt schedules after deleting a course and its milestones
  const currentSemester = await supabase
    .from("semesters")
    .select("*")
    .order("created_at", { ascending: false })
    .eq("is_active", true)
    .single();

  if (currentSemester.error || !currentSemester.data) {
    return { error: "Tidak dapat menemukan semester aktif." };
  }

  await reschedule({
    supabase,
    activeSemester: currentSemester.data,
    daysOfWeek: currentSemester.data.days_of_week as string[],
    maxStudyPages: currentSemester.data.max_study_pages,
  });

  revalidatePath("/", "layout");
  revalidatePath("/courses");
  revalidatePath("/calendar");
  return { success: true };
}
