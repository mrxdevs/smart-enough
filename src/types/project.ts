
export interface ProjectData {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  status?: "not-started" | "in-progress" | "completed";
  due_date?: string;
  total_tasks?: number;
  completed_tasks?: number;
  progress?: number;
  created_at?: string;
  updated_at?: string;
}
