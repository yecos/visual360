'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTourProjectStore } from '@/lib/store/tour-project-store';
import { PanoramaRenderer } from '@/lib/three-panorama';
import * as THREE from 'three';

interface PanoramaEditorProps {
  onNavigateToPoint?: (pointId: string) => void;
}

export function PanoramaEditor({ onNavigateToPoint }: PanoramaEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PanoramaRenderer | null>(null);
  const { project, selectedFloorId, selectedPointId, updatePoint } = useTourProjectStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFloor = project?.floors.find((f) => f.id === selectedFloorId);
  const selectedPoint = selectedFloor?.points.find((p) => p.id === selectedPointId);

  // Initialize renderer
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new PanoramaRenderer(containerRef.current);
    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Load panorama when selected point changes
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !selectedPoint) return;

    if (!selectedPoint.panoramaUrl) {
      renderer.removeHotspots();
      // Use a microtask to avoid calling setState synchronously in effect
      queueMicrotask(() => setError('No panorama uploaded for this point'));
      return;
    }

    queueMicrotask(() => {
      setError(null);
      setLoading(true);
    });

    renderer
      .loadPanorama(selectedPoint.panoramaUrl)
      .then(() => {
        setLoading(false);
        renderer.setView(selectedPoint.pitch, selectedPoint.yaw, selectedPoint.fov);

        // Add hotspots for connections
        renderer.removeHotspots();
        if (selectedFloor) {
          const connections = selectedFloor.connections.filter(
            (c) => c.fromId === selectedPoint.id
          );

          connections.forEach((conn) => {
            const toPoint = selectedFloor.points.find((p) => p.id === conn.toId);
            if (!toPoint) return;

            // Calculate 3D position from yaw/pitch for the hotspot
            const hotspotYaw = toPoint.yaw - selectedPoint.yaw;
            const hotspotPitch = 0;
            const phi = THREE.MathUtils.degToRad(90 - hotspotPitch);
            const theta = THREE.MathUtils.degToRad(hotspotYaw);
            const position = new THREE.Vector3(
              400 * Math.sin(phi) * Math.cos(theta),
              400 * Math.cos(phi),
              400 * Math.sin(phi) * Math.sin(theta)
            );

            renderer.addHotspot({
              id: conn.id,
              position,
              label: toPoint.name,
              onClick: () => {
                onNavigateToPoint?.(toPoint.id);
              },
            });
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load panorama:', err);
        setError('Failed to load panorama image');
        setLoading(false);
      });
  }, [selectedPoint?.id, selectedPoint?.panoramaUrl, selectedFloor]);

  // Sync view back to store on interaction
  useEffect(() => {
    if (!rendererRef.current || !selectedPointId || !selectedFloorId) return;

    const interval = setInterval(() => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      const view = renderer.getView();
      updatePoint(selectedFloorId, selectedPointId, {
        pitch: Math.round(view.pitch),
        yaw: Math.round(view.yaw),
        fov: Math.round(view.fov),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedPointId, selectedFloorId, updatePoint]);

  return (
    <div className="relative w-full h-full">
      {/* Renderer container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading panorama...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertCircle className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* No point selected */}
      {!selectedPoint && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Select a point with a panorama to preview
          </p>
        </div>
      )}

      {/* View controls hint */}
      {selectedPoint?.panoramaUrl && !loading && !error && (
        <div className="absolute bottom-3 left-3">
          <div className="bg-background/80 backdrop-blur-sm border rounded-md px-2 py-1 text-[10px] text-muted-foreground">
            Drag to look around · Scroll to zoom
          </div>
        </div>
      )}
    </div>
  );
}
