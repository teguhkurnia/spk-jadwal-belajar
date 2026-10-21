import { milestone } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { EventSourceInput } from "@fullcalendar/react";
import { cookies } from "next/headers";
import { notFound, unauthorized } from "next/navigation";
import { Suspense } from "react";
import { match } from "ts-pattern";
import CalendarContent from "./calendar-content";
import { connection } from "next/server";

const fetchSchedule = async (): Promise<EventSourceInput> => {
  try {
    const supabase = createClient(await cookies());
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return unauthorized();
    }

    // Fetch semester data
    const { data: semesterData } = await supabase
      .from("semesters")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .eq("is_active", true)
      .single();

    if (!semesterData) {
      return notFound();
    }

    // Fetch courses
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("*, milestones(*)") // Fetch milestones if needed
      .eq("user_id", session.user.id);

    if (coursesError || !coursesData || coursesData.length === 0) {
      return notFound();
    }

    const dailySchedules = await supabase
      .from("daily_schedules")
      .select("*, milestones(*), courses(*)")
      .eq("user_id", session.user.id)
      .eq("semester_id", semesterData.id);

    console.log("Fetched daily schedules:", dailySchedules);
    const schedules: DailyScheduleWithRelations[] =
      dailySchedules.data?.map(
        (item): DailyScheduleWithRelations => ({
          date: item.date,
          course: item.courses,
          from_page: item.from_page,
          to_page: item.to_page,
          milestone: item.milestones!,
          course_id: item.course_id,
          is_overload: item.is_overload,
          id: item.id,
          milestone_id: item.milestone_id,
          status: item.status,
          target_pages: item.target_pages,
          user_id: item.user_id,
          title: item.title,
        }),
      ) || [];

    console.log("Processed schedules:", schedules);

    const scheduleEvents: EventSourceInput = schedules.map((item) => {
      const style = match(item.status)
        .with("completed", () => ({
          backgroundColor: item.course.color || "#3b82f6", // default blue
          contrastColor: "#ffffff", // white text
          className: "opacity-50", // optional class for completed events
        })) // green
        .with("overdue", () => ({
          backgroundColor: item.course.color || "#3b82f6", // default blue
          contrastColor: "#ffffff", // white text
          className: "ring-2 ring-red-400", // optional class for overdue events
        })) // red
        .otherwise(() => ({
          backgroundColor: item.course.color || "#3b82f6", // default blue
          contrastColor: "#ffffff", // white text
          className: "",
        })); // default blue
      return {
        title: `${item.course.title}: Hal ${item.from_page} - ${item.to_page} (${item.milestone?.title || "No Milestone"})`,
        date: item.date,
        color: style.backgroundColor,
        contrastColor: style.contrastColor,
        className: style.className,
        extendedProps: {
          ...item,
          type: "study", // Add a type to differentiate between study and milestone events
        }, // Store the entire item for later use
      };
    });

    // add Tuton and Exam events
    const tutonEvents = [3, 5, 7].map((week, index) => {
      const milestoneDate = milestone(semesterData.start_tuton_date, week);
      const endMilestoneDate = milestone(
        semesterData.start_tuton_date,
        week + 2,
      );
      return {
        title: `Tuton ${index + 1}`,
        start: milestoneDate!.toISOString().split("T")[0],
        end: endMilestoneDate!.toISOString().split("T")[0],
        allDay: true,
        color: "#8b5cf6EE", // default purple for milestone events
        extendedProps: {
          type: "tuton",
        },
      };
    });

    const examEvents = coursesData
      .filter((course) => course.exam_date)
      .map((course) => ({
        title: `Ujian ${course.title}`,
        start: course.exam_date,
        allDay: true,
      }));

    scheduleEvents.push(...examEvents, ...tutonEvents);

    return scheduleEvents;
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return [];
  }
};

export const metadata = {
  title: "Kalendar",
  description: "Kalendar jadwal belajar",
};

async function CalendarData() {
  await connection();

  const events = await fetchSchedule();

  return <CalendarContent initialEvents={events} />;
}

export default async function CalendarPage() {
  return (
    <Suspense fallback={<div className="p-6">Memuat kalendar...</div>}>
      <CalendarData />
    </Suspense>
  );
}
