declare interface Milestone {
  id: string;
  course_id: string;
  title: string;
  target_pages: number;
  readed_pages: number;
  deadline: string;
  status: "pending" | "completed" | "overdue" | "critical";
}
