"use server";

import { addCourses } from "@/lib/course";
import { reschedule } from "@/lib/reschedule";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import z from "zod";
import { courseSchema } from "./type";

const saveOnboardingDataSchema = z.object({
  semesterName: z.string().min(1, "Nama semester wajib diisi."),
  startTutonDate: z.string().min(1, "Tanggal mulai tuton wajib diisi."),
  kmax: z.number().int().min(1, "Kapasitas belajar maksimal wajib diisi."),
  daysOfWeek: z.array(z.string()).min(1, "Hari belajar wajib dipilih."),
  courses: z
    .array(courseSchema)
    .min(1, "Setidaknya satu mata kuliah wajib ditambahkan."),
});

export async function saveOnboardingData(
  data: z.infer<typeof saveOnboardingDataSchema>,
) {
  try {
    const parsed = saveOnboardingDataSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const values = parsed.data;
    const supabase = createClient(await cookies());

    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      return { error: "Anda belum terautentikasi." };
    }

    //   insert semester
    const { error: semesterError, data: semesterData } = await supabase
      .from("semesters")
      .insert({
        user_id: userId,
        name: values.semesterName,
        start_study_date: values.startTutonDate,
        start_tuton_date: values.startTutonDate,
        max_study_pages: values.kmax,
        days_of_week: values.daysOfWeek,
        is_active: true,
      })
      .select("*")
      .single();

    if (semesterError) {
      console.error("Error inserting semester:", semesterError);
      return { error: "Terjadi kesalahan saat menyimpan data semester." };
    }

    // insert courses
    await addCourses(
      supabase,
      userId,
      semesterData.id,
      values.startTutonDate,
      values.courses,
    );

    // Reschedule daily schedules after adding new courses and their milestones
    await reschedule({
      supabase,
      activeSemester: semesterData,
      daysOfWeek: values.daysOfWeek,
      maxStudyPages: values.kmax,
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving onboarding data:", error);
    return { error: "Terjadi kesalahan saat menyimpan data." };
  }
}
