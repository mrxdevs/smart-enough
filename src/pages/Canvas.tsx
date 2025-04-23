
import { useState, useRef, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/App";
import { CanvasData } from "@/types/canvas";

// Helper: debounce function to limit how often a function can be called
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState("2");
  const [tool, setTool] = useState("pencil");
  const [canvasTitle, setCanvasTitle] = useState("Untitled Canvas");
  const [saveStatus, setSaveStatus] = useState("");
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Load canvas data
  useEffect(() => {
    if (!user) return;
    
    const loadCanvas = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("canvases")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
            
        if (error) {
          console.error("Error loading canvas:", error);
          setIsLoading(false);
          return;
        }
        
        if (data) {
          setCanvasData(data as CanvasData);
          setCanvasTitle(data.title || "Untitled Canvas");
          
          // Load canvas content
          const canvas = canvasRef.current;
          if (canvas && data.content) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const img = new Image();
              img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                setIsLoading(false);
              };
              img.onerror = () => {
                console.error("Failed to load canvas image");
                setIsLoading(false);
              };
              img.src = data.content;
            } else {
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading canvas:", error);
        setIsLoading(false);
      }
    };
    
    loadCanvas();
  }, [user]);

  // Save canvas data with debounce (to prevent too frequent saves)
  const saveCanvasToSupabase = debounce(async () => {
    if (!user) return;
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const content = canvas.toDataURL("image/png");
      
      // Update existing canvas
      if (canvasData?.id) {
        const { error } = await supabase
          .from("canvases")
          .update({
            title: canvasTitle,
            content: content,
            updated_at: new Date().toISOString()
          })
          .eq("id", canvasData.id);
          
        if (error) {
          console.error("Error updating canvas:", error);
          toast.error("Failed to save canvas");
          return;
        }
      } else {
        // Insert a new canvas
        const canvasToSave: CanvasData = {
          user_id: user.id,
          title: canvasTitle,
          content: content
        };
        
        const { data, error } = await supabase
          .from("canvases")
          .insert(canvasToSave)
          .select();
            
        if (error) {
          console.error("Error creating canvas:", error);
          toast.error("Failed to create canvas");
          return;
        }
        
        if (data && data.length > 0) {
          setCanvasData(data[0] as CanvasData);
        }
      }
      
      setSaveStatus("Canvas saved");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error saving canvas:", error);
      toast.error("Failed to save canvas");
    }
  }, 2000);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    
    ctx.beginPath();
    
    let clientX, clientY;
    
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      clientX = e.touches[0].clientX - rect.left;
      clientY = e.touches[0].clientY - rect.top;
    } else {
      clientX = e.clientX - rect.left;
      clientY = e.clientY - rect.top;
    }

    ctx.moveTo(clientX, clientY);

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
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let clientX, clientY;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX - rect.left;
      clientY = e.touches[0].clientY - rect.top;
    } else {
      clientX = e.clientX - rect.left;
      clientY = e.clientY - rect.top;
    }

    ctx.lineTo(clientX, clientY);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasToSupabase();
    }
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCanvasToSupabase();
  };
  
  const saveCanvas = () => {
    saveCanvasToSupabase();
    toast.success("Canvas saved successfully");
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCanvasTitle(e.target.value);
    saveCanvasToSupabase();
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions to match its container size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

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
                onChange={handleTitleChange}
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
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                Clear
              </Button>
              <Button size="sm" onClick={saveCanvas}>
                Save
              </Button>
              {saveStatus && (
                <span className="text-xs text-green-600">{saveStatus}</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 h-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Canvas;
