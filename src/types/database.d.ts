
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: "todo" | "in_progress" | "completed";
          tag: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: "not-started" | "in-progress" | "completed";
          due_date: string | null;
          total_tasks: number;
          completed_tasks: number;
          progress: number;
          created_at: string;
          updated_at: string;
        };
      };
      canvases: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
