import { Suspense } from "react";
import CalendarContent from "./calendar-content";
import { EventSourceInput } from "@fullcalendar/react";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { notFound, unauthorized } from "next/navigation";
import { generateFullSchedule, ScheduleDayItem } from "@/lib/schedule";
import { formatDate, milestone } from "@/lib/utils";
import { match } from "ts-pattern";

const fetchSchedule = async (): Promise<EventSourceInput> => {
  try {
    const supabase = createClient(await cookies());
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    // Fetch semester data
    const { data: semesterData } = await supabase
      .from("semesters")
      .select("*")
      .eq("user_id", user.id)
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
      .eq("user_id", user.id);

    if (coursesError || !coursesData || coursesData.length === 0) {
      return notFound();
    }

    const dailySchedules = await supabase
      .from("daily_schedules")
      .select("*, milestones(*), courses(*)")
      .eq("user_id", user.id)
      .eq("semester_id", semesterData.id);

    console.log("Fetched daily schedules:", dailySchedules);
    const schedules: DailyScheduleWithRelations[] =
      dailySchedules.data?.map((item) => ({
        date: item.date,
        course: item.courses,
        from_page: item.from_page,
        to_page: item.to_page,
        milestone: item.milestones,
        course_id: item.course_id,
        is_overload: item.is_overload,
        id: item.id,
        milestone_id: item.milestone_id,
        status: item.status,
        target_pages: item.target_pages,
        user_id: item.user_id,
        title: item.title,
      })) || [];

    console.log("Processed schedules:", schedules);

    const scheduleEvents: EventSourceInput = schedules.map((item) => {
      const style = match(item.status)
        .with("completed", () => ({
          backgroundColor: item.course.color || "#3b82f6", // default blue
          contrastColor: "#ffffff", // white text
          className: "opacity-70", // optional class for completed events
        })) // green
        .with("overdue", () => ({
          backgroundColor: item.course.color || "#3b82f6", // default blue
          contrastColor: "#ffffff", // white text
          className: "opacity-70", // optional class for overdue events
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
    const tutonEvents = scheduleEvents.concat(
      [3, 5, 7].map((week, index) => {
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
      }),
    );

    return tutonEvents;
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return [];
  }
};

export default async function CalendarPage() {
  const events = await fetchSchedule();
  return (
    <Suspense fallback={<div className="p-6">Memuat kalendar...</div>}>
      <CalendarContent initialEvents={events} />
    </Suspense>
  );
}
