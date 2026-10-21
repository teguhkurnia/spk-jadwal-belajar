"use server";

import z from "zod";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { milestone } from "@/lib/utils";
import { reschedule } from "@/lib/reschedule";
import { courseSchema } from "./type";
import { Database } from "@/types/database.types";

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
    const tutonDate = values.startTutonDate;
    for (const course of values.courses) {
      const { error: courseError, data: courseData } = await supabase
        .from("courses")
        .insert({
          user_id: userId,
          semester_id: semesterData.id,
          title: course.title,
          credits: course.credits,
          page_count: course.pageCount,
          exam_date: course.examDate,
          color: course.color,
        })
        .select("id")
        .single();

      if (courseError) {
        console.error("Error inserting course:", courseError);
        return { error: "Terjadi kesalahan saat menyimpan data mata kuliah." };
      }

      // insert milestones
      const milestoneRows = [
        {
          title: "Tuton 1",
          target_pages: course.milestone1,
          deadline: milestone(tutonDate, 3),
        },
        {
          title: "Tuton 2",
          target_pages: course.milestone2,
          deadline: milestone(tutonDate, 5),
        },
        {
          title: "Tuton 3",
          target_pages: course.milestone3,
          deadline: milestone(tutonDate, 7),
        },
      ].filter((m) => m.target_pages > 0);

      if (milestoneRows.length <= 0) {
        continue; // Skip if no milestones to insert
      }
      const { error: milestoneError } = await supabase
        .from("milestones")
        .insert(
          milestoneRows.map(
            (m): Database["public"]["Tables"]["milestones"]["Insert"] => ({
              user_id: userId,
              course_id: courseData.id,
              readed_pages: 0,
              status: "pending",
              title: m.title,
              target_pages: m.target_pages,
              deadline: m.deadline!,
              semester_id: semesterData.id,
            }),
          ),
        );

      if (milestoneError) {
        console.error("Error inserting milestones:", milestoneError);
        return { error: "Terjadi kesalahan saat menyimpan data milestone." };
      }
    }

    console.log("semesterData:", semesterData);

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
