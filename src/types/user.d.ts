declare interface Semester {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  max_study_pages: number;
  days_of_week: string[]; // ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  start_tuton_date: string; // ISO date string
  start_study_date: string; // ISO date string
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}
