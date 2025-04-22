import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsAuthenticated(true);
        setUserId(data.session.user.id);
      } else {
        navigate("/auth");
      }
    };
    
    checkAuth();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        navigate("/auth");
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Load canvas data
  useEffect(() => {
    if (userId) {
      const loadCanvas = async () => {
        try {
          // Table typing workaround, since the Supabase schema is empty
          const { data, error } = await (supabase
            .from("canvases") as any)
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (error) {
            console.error("Error loading canvas:", error);
            return;
          }
          
          if (data) {
            setCanvasData(data as CanvasData);
            setCanvasTitle((data as CanvasData).title || "Untitled Canvas");
            
            // Load canvas content
            const canvas = canvasRef.current;
            if (canvas && (data as CanvasData).content) {
              const ctx = canvas.getContext("2d");
              if (ctx) {
                const img = new Image();
                img.onload = () => {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                };
                img.src = (data as CanvasData).content;
              }
            }
          }
        } catch (error) {
          console.error("Error loading canvas:", error);
        }
      };
      
      loadCanvas();
    }
  }, [userId]);

  // Save canvas data with debounce (to prevent too frequent saves)
  const saveCanvasToSupabase = debounce(async () => {
    if (!userId || !isAuthenticated) return;
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const content = canvas.toDataURL("image/png");
      const canvasToSave: CanvasData = {
        user_id: userId,
        title: canvasTitle,
        content: content
      };
      
      // Update existing canvas
      if (canvasData?.id) {
        const { error } = await (supabase
          .from("canvases") as any)
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
        try {
          const { error } = await (supabase
            .from("canvases") as any)
            .insert(canvasToSave as any);
            
          if (error) {
            console.error("Error creating canvas:", error);
            toast.error("Failed to create canvas");
            return;
          }
          
          // Fetch newly created canvas
          const { data, error: fetchError } = await (supabase
            .from("canvases") as any)
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
            
          if (fetchError) {
            console.error("Error fetching new canvas:", fetchError);
          } else {
            setCanvasData(data as CanvasData);
          }
        } catch (error) {
          console.error("Error in canvas creation flow:", error);
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
      (e as any).preventDefault();
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

  // Don't render anything until authentication is checked
  if (!isAuthenticated && userId === null) {
    return null;
  }

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
                  saveCanvasToSupabase();
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
              <Button variant="outline" size="sm" onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                saveCanvasToSupabase();
              }}>
                Clear
              </Button>
              <Button size="sm" onClick={() => {
                saveCanvasToSupabase();
                toast.success("Canvas saved successfully");
              }}>
                Save
              </Button>
              {saveStatus && (
                <span className="text-xs text-green-600">{saveStatus}</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 h-full">
          <div className="w-full h-full overflow-hidden canvas-container">
            <canvas
              ref={canvasRef}
              className="touch-none"
              onMouseDown={(e) => {
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
              }}
              onMouseMove={(e) => {
                if (!isDrawing) return;
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                let clientX, clientY;
                const rect = canvas.getBoundingClientRect();

                if ('touches' in e) {
                  (e as any).preventDefault();
                  clientX = e.touches[0].clientX - rect.left;
                  clientY = e.touches[0].clientY - rect.top;
                } else {
                  clientX = e.clientX - rect.left;
                  clientY = e.clientY - rect.top;
                }

                ctx.lineTo(clientX, clientY);
                ctx.stroke();
              }}
              onMouseUp={() => {
                if (isDrawing) {
                  setIsDrawing(false);
                  saveCanvasToSupabase();
                }
              }}
              onMouseLeave={() => {
                if (isDrawing) {
                  setIsDrawing(false);
                  saveCanvasToSupabase();
                }
              }}
              onTouchStart={(e) => {
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
              }}
              onTouchMove={(e) => {
                if (!isDrawing) return;
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                let clientX, clientY;
                const rect = canvas.getBoundingClientRect();

                if ('touches' in e) {
                  (e as any).preventDefault();
                  clientX = e.touches[0].clientX - rect.left;
                  clientY = e.touches[0].clientY - rect.top;
                }
                ctx.lineTo(clientX, clientY);
                ctx.stroke();
              }}
              onTouchEnd={() => {
                if (isDrawing) {
                  setIsDrawing(false);
                  saveCanvasToSupabase();
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Canvas;
