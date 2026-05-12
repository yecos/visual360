'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Globe, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanoramaRenderer } from '@/lib/three-panorama';
import type { TourProject, Floor, TourPoint } from '@/lib/store/tour-project-store';
import { PanoramaViewer } from './panorama-viewer';
import { HotspotOverlay } from './hotspot-overlay';
import { CompassWidget } from './compass-widget';
import { WalkthroughControls } from './walkthrough-controls';
import * as THREE from 'three';

interface TourViewerProps {
  project: TourProject;
}

export function TourViewer({ project }: TourViewerProps) {
  const [started, setStarted] = useState(false);
  const [currentFloorIndex, setCurrentFloorIndex] = useState(0);
  const [currentPointId, setCurrentPointId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState({ pitch: 0, yaw: 0, fov: 75 });
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const rendererRef = useRef<PanoramaRenderer | null>(null);
  const walkthroughTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentFloor: Floor | undefined = project.floors[currentFloorIndex];
  const currentPoint: TourPoint | undefined = currentFloor?.points.find(
    (p) => p.id === currentPointId
  );

  // All points across all floors for walkthrough
  const allPoints = project.floors.flatMap((f) => f.points);

  // Walkthrough state
  const walkthrough = project.walkthrough;
  const walkthroughPoints = walkthrough
    ? walkthrough.pointIds
        .map((pid) => allPoints.find((p) => p.id === pid))
        .filter(Boolean) as TourPoint[]
    : [];
  const currentWalkthroughIndex = walkthrough
    ? walkthrough.pointIds.indexOf(currentPointId || '')
    : -1;

  const handleNavigate = useCallback(
    (pointId: string) => {
      // Find which floor this point belongs to
      const floorIndex = project.floors.findIndex((f) =>
        f.points.some((p) => p.id === pointId)
      );
      if (floorIndex >= 0) {
        setCurrentFloorIndex(floorIndex);
      }
      setCurrentPointId(pointId);
      setIsPlaying(false);
    },
    [project.floors]
  );

  const handleStartTour = useCallback(() => {
    setStarted(true);
    // Set initial point
    const firstFloor = project.floors[0];
    if (firstFloor?.points.length) {
      setCurrentPointId(firstFloor.points[0].id);
    }
  }, [project.floors]);

  const handleSwitchFloor = useCallback(
    (index: number) => {
      setCurrentFloorIndex(index);
      const floor = project.floors[index];
      if (floor?.points.length) {
        setCurrentPointId(floor.points[0].id);
      } else {
        setCurrentPointId(null);
      }
    },
    [project.floors]
  );

  const handleViewChange = useCallback((view: { pitch: number; yaw: number; fov: number }) => {
    setCurrentView(view);
  }, []);

  const handleRendererReady = useCallback((renderer: PanoramaRenderer) => {
    rendererRef.current = renderer;
  }, []);

  // Load hotspots when point changes
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !currentPoint || !currentFloor) return;

    // Set view
    renderer.setView(currentPoint.pitch, currentPoint.yaw, currentPoint.fov);

    // Add hotspots for connections
    renderer.removeHotspots();
    const connections = currentFloor.connections.filter(
      (c) => c.fromId === currentPoint.id || c.toId === currentPoint.id
    );

    connections.forEach((conn) => {
      const otherPointId = conn.fromId === currentPoint.id ? conn.toId : conn.fromId;
      const otherPoint = currentFloor.points.find((p) => p.id === otherPointId);
      if (!otherPoint) return;

      // Calculate 3D position for hotspot
      const deltaYaw = otherPoint.yaw - currentPoint.yaw;
      const phi = THREE.MathUtils.degToRad(90);
      const theta = THREE.MathUtils.degToRad(deltaYaw);
      const position = new THREE.Vector3(
        400 * Math.sin(phi) * Math.cos(theta),
        400 * Math.cos(phi),
        400 * Math.sin(phi) * Math.sin(theta)
      );

      renderer.addHotspot({
        id: conn.id,
        position,
        label: otherPoint.name,
        onClick: () => handleNavigate(otherPointId),
      });
    });
  }, [currentPointId, currentFloor, handleNavigate]);

  // Walkthrough playback
  useEffect(() => {
    if (!isPlaying || !walkthrough) return;

    walkthroughTimerRef.current = setInterval(() => {
      const nextIndex = currentWalkthroughIndex + 1;
      if (nextIndex >= walkthrough.pointIds.length) {
        setIsPlaying(false);
        return;
      }
      const nextPointId = walkthrough.pointIds[nextIndex];
      if (nextPointId) {
        handleNavigate(nextPointId);
      }
    }, walkthrough.interval * 1000);

    return () => {
      if (walkthroughTimerRef.current) {
        clearInterval(walkthroughTimerRef.current);
      }
    };
  }, [isPlaying, walkthrough, currentWalkthroughIndex, handleNavigate]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (!started || !showControls) return;

    const timer = setTimeout(() => setShowControls(false), 4000);
    return () => clearTimeout(timer);
  }, [showControls, started]);

  // Welcome/splash screen
  if (!started) {
    return (
      <div className="relative w-full h-full bg-black">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Logo */}
            <div className="mb-6">
              {project.branding?.logo ? (
                <img
                  src={project.branding.logo}
                  alt="Logo"
                  className="size-16 mx-auto object-contain rounded-lg"
                />
              ) : (
                <div
                  className="size-16 mx-auto rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: project.branding?.primaryColor || '#3B82F6' }}
                >
                  <Globe className="size-8 text-white" />
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-white/60 max-w-md mb-8">{project.description}</p>
            )}

            <button
              className="px-8 py-3 rounded-full text-white font-medium text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
              style={{ backgroundColor: project.branding?.primaryColor || '#3B82F6' }}
              onClick={handleStartTour}
            >
              Start Tour
              <ChevronRight className="size-5" />
            </button>

            {project.branding?.companyName && (
              <p className="text-white/40 text-sm mt-6">
                by {project.branding.companyName}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // No points
  if (!currentPoint) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <p className="text-white/60">No viewpoints available</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full bg-black"
      onMouseMove={() => setShowControls(true)}
    >
      {/* Panorama viewer */}
      {currentPoint.panoramaUrl && (
        <PanoramaViewer
          panoramaUrl={currentPoint.panoramaUrl}
          pitch={currentPoint.pitch}
          yaw={currentPoint.yaw}
          fov={currentPoint.fov}
          onViewChange={handleViewChange}
          onReady={handleRendererReady}
        />
      )}

      {/* Hotspot overlay (as fallback for 2D rendering) */}
      {!currentPoint.panoramaUrl && currentFloor && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="text-center text-white">
            <Globe className="size-12 mx-auto mb-4 opacity-40" />
            <p className="text-sm text-white/60">
              No panorama for this point.
              <br />
              Click a hotspot to navigate.
            </p>
            <HotspotOverlay
              connections={currentFloor.connections}
              points={currentFloor.points}
              currentPointId={currentPoint.id}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      )}

      {/* UI Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
              {/* Branding */}
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                {project.branding?.logo && (
                  <img
                    src={project.branding.logo}
                    alt="Logo"
                    className="size-6 object-contain"
                  />
                )}
                <span className="text-white text-sm font-medium">{project.name}</span>
              </div>

              {/* Point name */}
              <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="text-white text-sm">{currentPoint.name}</span>
              </div>

              {/* Close button (returns to editor/dashboard) */}
              <button
                className="bg-black/40 backdrop-blur-sm rounded-full p-2 text-white/80 hover:text-white transition-colors"
                onClick={() => window.history.back()}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Compass */}
            <div className="absolute top-16 right-4 pointer-events-none">
              <CompassWidget yaw={currentView.yaw} />
            </div>

            {/* Floor switcher */}
            {project.floors.length > 1 && (
              <div className="absolute bottom-4 left-4 pointer-events-auto">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2 space-y-1">
                  {project.floors.map((floor, index) => (
                    <button
                      key={floor.id}
                      className={`block w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                        index === currentFloorIndex
                          ? 'bg-white/20 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => handleSwitchFloor(index)}
                    >
                      {floor.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Walkthrough controls */}
            {walkthrough && walkthroughPoints.length > 0 && (
              <div className="absolute bottom-4 right-4 pointer-events-auto">
                <WalkthroughControls
                  isPlaying={isPlaying}
                  currentStep={currentWalkthroughIndex}
                  totalSteps={walkthroughPoints.length}
                  interval={walkthrough.interval}
                  autoplay={walkthrough.autoplay}
                  onPlay={() => {
                    if (currentWalkthroughIndex < 0) {
                      const firstId = walkthrough.pointIds[0];
                      if (firstId) handleNavigate(firstId);
                    }
                    setIsPlaying(true);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onNext={() => {
                    const nextIdx = currentWalkthroughIndex + 1;
                    if (nextIdx < walkthrough.pointIds.length) {
                      handleNavigate(walkthrough.pointIds[nextIdx]);
                    }
                  }}
                  onPrev={() => {
                    const prevIdx = currentWalkthroughIndex - 1;
                    if (prevIdx >= 0) {
                      handleNavigate(walkthrough.pointIds[prevIdx]);
                    }
                  }}
                  onReset={() => {
                    const firstId = walkthrough.pointIds[0];
                    if (firstId) handleNavigate(firstId);
                  }}
                  onIntervalChange={() => {
                    // Viewer-only, doesn't update project
                  }}
                  onAutoplayToggle={() => {}}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
