
export interface TaskData {
  id?: string;
  user_id?: string;
  title: string;
  status: "todo" | "in-progress" | "completed";
  tag?: string;
  created_at?: string;
  updated_at?: string;
}
