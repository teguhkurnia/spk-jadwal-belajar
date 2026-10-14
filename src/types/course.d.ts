declare interface Course {
  id: string;
  user_id: string;
  title: string;
  credits: number;
  page_count: number;
  exam_date: string;
  color: string;
  completed_pages?: number;
  created_at: string;
  updated_at: string;
}

declare interface CourseWithMilestones extends Course {
  milestones: Milestone[];
}
