import dayjs from "dayjs";
import { milestone } from "./utils";
import z from "zod";
import { courseSchema } from "@/actions/type";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

type AddCoursePayload = z.infer<typeof courseSchema>[];

function generateMilestones(payload: {
  milestone1: number;
  milestone2: number;
  milestone3: number;
  tutonDate: string;
}) {
  return [
    {
      title: "Tuton 1",
      target_pages: payload.milestone1,
      deadline: milestone(payload.tutonDate, 3),
    },
    {
      title: "Tuton 2",
      target_pages: payload.milestone2,
      deadline: milestone(payload.tutonDate, 5),
    },
    {
      title: "Tuton 3",
      target_pages: payload.milestone3,
      deadline: milestone(payload.tutonDate, 7),
    },
  ].filter((m) => m.target_pages > 0);
}

export async function addCourses(
  supabase: SupabaseClient<Database>,
  userId: string,
  semesterId: string,
  startTutonDate: string,
  payload: AddCoursePayload,
) {
  for (const course of payload) {
    const { error: courseError, data: courseData } = await supabase
      .from("courses")
      .insert({
        user_id: userId,
        semester_id: semesterId,
        title: course.title,
        credits: course.credits,
        page_count: course.pageCount,
        exam_date: course.examDate,
        color: course.color,
      })
      .select("id")
      .single();

    if (courseError) {
      throw new Error("Terjadi kesalahan saat menyimpan data mata kuliah.");
    }

    const milestones = generateMilestones({
      milestone1: course.milestone1,
      milestone2: course.milestone2,
      milestone3: course.milestone3,
      tutonDate: startTutonDate,
    });

    if (milestones.length === 0) {
      continue; // Skip if no milestones to insert
    }

    let remainingRead = course.readPages ?? 0;

    const { error: milestoneError } = await supabase.from("milestones").insert(
      milestones.map(
        (m): Database["public"]["Tables"]["milestones"]["Insert"] => {
          const readedForMilestone = Math.min(remainingRead, m.target_pages);
          remainingRead = Math.max(0, remainingRead - readedForMilestone);
          const isCompleted =
            m.target_pages > 0 && readedForMilestone >= m.target_pages;

          return {
            user_id: userId,
            course_id: courseData.id,
            readed_pages: readedForMilestone,
            status: isCompleted ? "completed" : "pending",
            title: m.title,
            target_pages: m.target_pages,
            deadline: m.deadline!,
            semester_id: semesterId,
          };
        },
      ),
    );

    if (milestoneError) {
      throw new Error("Terjadi kesalahan saat menyimpan data milestone.");
    }
  }
}
