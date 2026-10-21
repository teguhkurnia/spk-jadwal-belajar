declare interface DailySchedule {
  id: string;
  user_id: string;
  course_id: string;
  milestone_id: string;
  date: string; // ISO date string
  title: string;
  target_pages: number;
  from_page: number;
  to_page: number;
  is_overload: boolean;
  status: "pending" | "completed" | "overdue" | "critical";
}

declare interface DailyScheduleInput extends Omit<
  DailySchedule,
  "id" | "status"
> {}

declare interface DailyScheduleWithRelations extends DailySchedule {
  course: Course;
  milestone: Milestone;
}
