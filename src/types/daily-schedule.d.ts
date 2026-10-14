declare interface DailySchedule {
  id: string;
  user_id: string;
  course_id: string;
  milestone_id?: string | null;
  date: string; // ISO date string
  target_pages: number;
  status: "pending" | "completed" | "overdue" | "critical";
}
