
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import debounce from "lodash/debounce";
import type { Database } from "@/types/supabase";

type CanvasRow = Database["public"]["Tables"]["canvases"]["Row"];

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState("2");
  const [tool, setTool] = useState("pencil");
  const [canvasTitle, setCanvasTitle] = useState("Untitled Canvas");
  const { user } = useAuth();
  const [canvasData, setCanvasData] = useState<CanvasRow | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;

    const loadCanvas = async () => {
      const { data, error } = await supabase
        .from("canvases")
        .select()
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast.error("Error loading canvas");
        return;
      }

      if (data) {
        setCanvasTitle(data.title);
        setCanvasData(data);
        // Implement canvas content loading logic here
      }
    };

    loadCanvas();
  }, [user]);

  // Debounced save function
  const saveCanvas = debounce(async () => {
    if (!user || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const content = canvas.toDataURL();

    const canvasData = {
      user_id: user.id,
      title: canvasTitle,
      content: content,
    };

    const { error } = await supabase
      .from("canvases")
      .upsert(canvasData)
      .select()
      .single();

    if (error) {
      toast.error("Error saving canvas");
      return;
    }

    toast.success("Canvas saved");
  }, 1000);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    
    ctx.beginPath();
    
    let clientX, clientY;
    
    if ('touches' in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      clientX = e.touches[0].clientX - rect.left;
      clientY = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      const rect = canvas.getBoundingClientRect();
      clientX = e.clientX - rect.left;
      clientY = e.clientY - rect.top;
    }
    
    ctx.moveTo(clientX, clientY);
    
    // Apply settings
    ctx.strokeStyle = color;
    ctx.lineWidth = parseInt(brushSize);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let clientX, clientY;
    
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect();
      clientX = e.touches[0].clientX - rect.left;
      clientY = e.touches[0].clientY - rect.top;
    } else {
      const rect = canvas.getBoundingClientRect();
      clientX = e.clientX - rect.left;
      clientY = e.clientY - rect.top;
    }
    
    ctx.lineTo(clientX, clientY);
    ctx.stroke();
    
    // Save canvas after drawing
    saveCanvas();
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  
  useEffect(() => {
    // Save canvas when component unmounts
    return () => {
      saveCanvas();
    };
  }, [saveCanvas]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Canvas</h1>
        <p className="text-muted-foreground mt-1">Create diagrams and sketches</p>
      </div>
      
      <Card className="h-[calc(100vh-240px)]">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <Input
                value={canvasTitle}
                onChange={(e) => {
                  setCanvasTitle(e.target.value);
                  saveCanvas();
                }}
                className="w-40 h-8"
              />
              <Select value={tool} onValueChange={setTool}>
                <SelectTrigger className="w-28 h-8">
                  <SelectValue placeholder="Tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pencil">Pencil</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="eraser">Eraser</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                  disabled={tool === "eraser"}
                />
                <Select value={brushSize} onValueChange={setBrushSize}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Thin</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="5">Thick</SelectItem>
                    <SelectItem value="10">Extra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={saveCanvas}>
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 h-full">
          <div className="w-full h-full overflow-hidden canvas-container">
            <canvas
              ref={canvasRef}
              className="touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Canvas;
