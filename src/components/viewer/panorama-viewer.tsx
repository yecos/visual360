'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { PanoramaRenderer } from '@/lib/three-panorama';

interface PanoramaViewerProps {
  panoramaUrl: string;
  pitch?: number;
  yaw?: number;
  fov?: number;
  onViewChange?: (view: { pitch: number; yaw: number; fov: number }) => void;
  onReady?: (renderer: PanoramaRenderer) => void;
}

export function PanoramaViewer({
  panoramaUrl,
  pitch = 0,
  yaw = 0,
  fov = 75,
  onViewChange,
  onReady,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PanoramaRenderer | null>(null);

  // Track loaded state: which URL is loaded and its status
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Derived loading state
  const isLoading = panoramaUrl !== loadedUrl && !loadError;

  // Initialize renderer
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new PanoramaRenderer(containerRef.current);
    rendererRef.current = renderer;
    onReady?.(renderer);

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [onReady]);

  // Load panorama when URL changes
  const loadPanorama = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer || !panoramaUrl) return;

    renderer
      .loadPanorama(panoramaUrl)
      .then(() => {
        setLoadedUrl(panoramaUrl);
        setLoadError(null);
        renderer.setView(pitch, yaw, fov);
      })
      .catch((err) => {
        console.error('Failed to load panorama:', err);
        setLoadError('Failed to load panorama');
        setLoadedUrl(null);
      });
  }, [panoramaUrl, pitch, yaw, fov]);

  useEffect(() => {
    if (!panoramaUrl || !rendererRef.current) return;
    loadPanorama();
  }, [panoramaUrl, loadPanorama]);

  // Sync view changes back to parent
  useEffect(() => {
    if (!onViewChange || !rendererRef.current) return;

    const interval = setInterval(() => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      onViewChange(renderer.getView());
    }, 500);

    return () => clearInterval(interval);
  }, [onViewChange]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-10 animate-spin text-white" />
            <p className="text-sm text-white/80">Loading panorama...</p>
          </div>
        </div>
      )}

      {loadError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="size-10 text-white/60" />
            <p className="text-sm text-white/80">{loadError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
