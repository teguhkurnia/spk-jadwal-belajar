"use server";

import { addCourses } from "@/lib/course";
import { reschedule } from "@/lib/reschedule";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { courseSchema } from "./type";
import z from "zod";

export type AddCourseState = {
  error?: string;
  success?: boolean;
};

export async function addCourse(
  _prev: AddCourseState,
  formData: z.infer<typeof courseSchema>,
): Promise<AddCourseState> {
  const parsed = courseSchema.safeParse(formData);
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

  await addCourses(supabase, user.id, currentSemester.data.id, tutonDate, [
    values,
  ]);

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
