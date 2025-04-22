
export type Profile = {
  id: string;
  username: string | null;
  created_at: string;
};

export type Canvas = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  status: string;
  tag: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      canvases: {
        Row: Canvas;
        Insert: Omit<Canvas, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Canvas, "id" | "created_at" | "updated_at">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "created_at" | "updated_at">>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
