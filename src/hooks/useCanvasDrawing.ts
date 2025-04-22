
import { useState, useRef, useEffect, RefObject } from "react";
import { toast } from "sonner";
import debounce from "lodash/debounce";
import { supabase } from "@/integrations/supabase/client";

interface CanvasDrawingProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  tool: string;
  color: string;
  brushSize: string;
  onSave?: () => void;
}

export const useCanvasDrawing = ({
  canvasRef,
  tool,
  color,
  brushSize,
  onSave,
}: CanvasDrawingProps) => {
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match container
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
  }, [canvasRef]);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();

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

    ctx.moveTo(clientX, clientY);
    ctx.strokeStyle = color;
    ctx.lineWidth = parseInt(brushSize);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
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

    if (onSave) {
      onSave();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return {
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
  };
};
