
export interface CanvasData {
  id?: string;
  user_id?: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

// Extended Database Definition including the canvases table
export type CanvasesTable = {
  Tables: {
    canvases: {
      Row: CanvasData;
      Insert: Omit<CanvasData, "id" | "created_at" | "updated_at"> & { user_id: string };
      Update: Partial<Omit<CanvasData, "id" | "created_at" | "user_id">>;
    };
  };
};
