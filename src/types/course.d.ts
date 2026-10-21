declare interface Course {
  id: string;
  user_id: string | null;
  semester_id?: string | null;
  title: string;
  credits: number;
  page_count: number;
  exam_date: string;
  color: string;
  completed_pages?: number;
  milestones?: { readed_pages: number }[] | null;
  created_at: string | null;
  updated_at: string | null;
}

declare interface CourseWithMilestones extends Course {
  milestones: Milestone[];
}
