'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Upload, ZoomIn, ZoomOut, Maximize, MapPin, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTourProjectStore } from '@/lib/store/tour-project-store';
import { saveFile, fileToBase64, base64ToDataURL } from '@/lib/storage';

interface FloorPlanCanvasProps {
  onPointSelect?: (pointId: string) => void;
}

export function FloorPlanCanvas({ onPointSelect }: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const { project, selectedFloorId, selectedPointId, addPoint, updatePoint, selectPoint } =
    useTourProjectStore();

  const selectedFloor = project?.floors.find((f) => f.id === selectedFloorId);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartOffset, setPanStartOffset] = useState({ x: 0, y: 0 });
  const [dragPointId, setDragPointId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [planImage, setPlanImage] = useState<string | null>(null);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw grid background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    const gridSize = 20 * zoom;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;

    for (let x = offsetX; x < rect.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = offsetY; y < rect.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Apply pan and zoom
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw floor plan image
    if (imageRef.current) {
      const img = imageRef.current;
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      // Scale image to fit canvas nicely
      const scaleX = rect.width / imgW;
      const scaleY = rect.height / imgH;
      const scale = Math.min(scaleX, scaleY, 1);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = (rect.width / zoom - drawW) / 2 - pan.x / zoom;
      const drawY = (rect.height / zoom - drawH) / 2 - pan.y / zoom;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    if (!selectedFloor) {
      ctx.restore();
      return;
    }

    // Draw connections
    selectedFloor.connections.forEach((conn) => {
      const fromPoint = selectedFloor.points.find((p) => p.id === conn.fromId);
      const toPoint = selectedFloor.points.find((p) => p.id === conn.toId);
      if (!fromPoint || !toPoint) return;

      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.moveTo(fromPoint.x, fromPoint.y);
      ctx.lineTo(toPoint.x, toPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw arrowhead
      const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);
      const arrowLen = 10;
      const midX = (fromPoint.x + toPoint.x) / 2;
      const midY = (fromPoint.y + toPoint.y) / 2;
      ctx.beginPath();
      ctx.fillStyle = '#6366f1';
      ctx.moveTo(
        midX + arrowLen * Math.cos(angle),
        midY + arrowLen * Math.sin(angle)
      );
      ctx.lineTo(
        midX + arrowLen * Math.cos(angle + (2.5 * Math.PI) / 3),
        midY + arrowLen * Math.sin(angle + (2.5 * Math.PI) / 3)
      );
      ctx.lineTo(
        midX + arrowLen * Math.cos(angle - (2.5 * Math.PI) / 3),
        midY + arrowLen * Math.sin(angle - (2.5 * Math.PI) / 3)
      );
      ctx.closePath();
      ctx.fill();
    });

    // Draw points
    selectedFloor.points.forEach((point) => {
      const isSelected = point.id === selectedPointId;

      // Outer glow for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
        ctx.fill();
      }

      // Point circle
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#4f46e5' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Label
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      ctx.fillText(point.name, point.x, point.y - 16);
    });

    ctx.restore();
  }, [selectedFloor, selectedPointId, zoom, pan]);

  // Load floor plan image when floor changes
  useEffect(() => {
    if (selectedFloor?.planImage) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        queueMicrotask(() => setPlanImage(selectedFloor.planImage!));
        renderCanvas();
      };
      img.src = selectedFloor.planImage;
    } else {
      imageRef.current = null;
      queueMicrotask(() => setPlanImage(null));
      renderCanvas();
    }
  }, [selectedFloor?.id, selectedFloor?.planImage, renderCanvas]);

  // Re-render when relevant data changes
  useEffect(() => {
    renderCanvas();
  }, [selectedFloor, selectedPointId, zoom, pan, renderCanvas]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => renderCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - pan.x) / zoom;
      const y = (screenY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [zoom, pan]
  );

  const findPointAt = useCallback(
    (canvasX: number, canvasY: number) => {
      if (!selectedFloor) return null;
      for (const point of selectedFloor.points) {
        const dx = canvasX - point.x;
        const dy = canvasY - point.y;
        if (dx * dx + dy * dy < 15 * 15) {
          return point;
        }
      }
      return null;
    },
    [selectedFloor]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        // Middle click or Alt+click: pan
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        setPanStartOffset({ ...pan });
        return;
      }

      const pos = screenToCanvas(e.clientX, e.clientY);
      const hitPoint = findPointAt(pos.x, pos.y);

      if (hitPoint) {
        setDragPointId(hitPoint.id);
        setDragOffset({ x: pos.x - hitPoint.x, y: pos.y - hitPoint.y });
        selectPoint(hitPoint.id);
        onPointSelect?.(hitPoint.id);
      }
    },
    [screenToCanvas, findPointAt, selectPoint, onPointSelect, pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPan({ x: panStartOffset.x + dx, y: panStartOffset.y + dy });
        return;
      }

      if (dragPointId && selectedFloorId) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        updatePoint(selectedFloorId, dragPointId, {
          x: Math.round(pos.x - dragOffset.x),
          y: Math.round(pos.y - dragOffset.y),
        });
      }
    },
    [isPanning, panStart, panStartOffset, dragPointId, selectedFloorId, screenToCanvas, dragOffset, updatePoint]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragPointId(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragPointId) return;
      const pos = screenToCanvas(e.clientX, e.clientY);
      const hitPoint = findPointAt(pos.x, pos.y);

      if (!hitPoint && selectedFloorId) {
        // Add new point at click position
        const pointNum = selectedFloor ? selectedFloor.points.length + 1 : 1;
        addPoint(selectedFloorId, {
          name: `Point ${pointNum}`,
          x: Math.round(pos.x),
          y: Math.round(pos.y),
          panoramaUrl: '',
          panoramaType: 'image',
          pitch: 0,
          yaw: 0,
          fov: 75,
        });
      }
    },
    [screenToCanvas, findPointAt, selectedFloorId, selectedFloor, addPoint, dragPointId]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.2, Math.min(5, prev * delta)));
  }, []);

  const handleUploadPlan = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !project || !selectedFloorId) return;

      try {
        const base64 = await fileToBase64(file);
        const dataUrl = base64ToDataURL(base64, file.type);
        useTourProjectStore.getState().updateFloor(selectedFloorId, {
          planImage: dataUrl,
        });
        await saveFile(project.id, `floorplan-${selectedFloorId}`, base64, file.type, file.name);
      } catch (error) {
        console.error('Failed to upload floor plan:', error);
      }
    },
    [project, selectedFloorId]
  );

  const handleZoomIn = () => setZoom((prev) => Math.min(5, prev * 1.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.2, prev * 0.8));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-muted/30">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Empty state for no floor plan */}
      {!planImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground pointer-events-auto">
            <ImageOff className="size-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm mb-2">No floor plan uploaded</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3.5" />
              Upload Floor Plan
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-background/90 backdrop-blur-sm border rounded-lg p-1 shadow-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" onClick={handleZoomOut}>
                <ZoomOut className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" onClick={handleZoomIn}>
                <ZoomIn className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" onClick={handleZoomReset}>
                <Maximize className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="w-px h-5 bg-border mx-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload Floor Plan</TooltipContent>
        </Tooltip>
      </div>

      {/* Info badge */}
      <div className="absolute top-3 left-3">
        <div className="bg-background/90 backdrop-blur-sm border rounded-md px-2 py-1 text-[10px] text-muted-foreground">
          {selectedFloor ? (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {selectedFloor.points.length} points · Click to add · Drag to move
            </span>
          ) : (
            'Select a floor'
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadPlan}
      />
    </div>
  );
}
