declare interface Milestone {
  id: string;
  user_id: string;
  semester_id: string;
  course_id: string;
  title: string;
  target_pages: number;
  readed_pages: number;
  deadline: string;
  status: "pending" | "completed" | "overdue" | "critical";
}

declare interface MilestoneInput extends Omit<
  Milestone,
  "id" | "readed_pages" | "status"
> {}
