"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { PanoramaRenderer, type HotspotData } from "@/lib/three-panorama";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Info,
  MapPin,
} from "lucide-react";

interface TourPointDB {
  id: string;
  name: string;
  x: number;
  y: number;
  panoramaUrl: string;
  panoramaType: string;
  pitch: number;
  yaw: number;
  fov: number;
  fromConnections: { id: string; fromId: string; toId: string }[];
  toConnections: { id: string; fromId: string; toId: string }[];
}

interface FloorDB {
  id: string;
  name: string;
  order: number;
  planImage: string | null;
  points: TourPointDB[];
}

interface BrandingDB {
  id: string;
  logo: string | null;
  primaryColor: string;
  companyName: string | null;
  contactInfo: string | null;
}

interface WalkthroughDB {
  id: string;
  pointIds: string;
  autoplay: boolean;
  interval: number;
  narrationUrl: string | null;
}

interface TourData {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  isPublic: boolean;
  shareSlug: string | null;
  floors: FloorDB[];
  branding: BrandingDB | null;
  walkthrough: WalkthroughDB | null;
}

export default function TourPage() {
  const params = useParams();
  const slug = params.slug as string;

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PanoramaRenderer | null>(null);

  const [tourData, setTourData] = useState<TourData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPoint, setCurrentPoint] = useState<TourPointDB | null>(null);
  const [currentFloorIndex, setCurrentFloorIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Fetch tour data
  useEffect(() => {
    async function fetchTour() {
      try {
        const res = await fetch(`/api/tour/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Tour not found or not publicly accessible");
          } else {
            setError("Failed to load tour");
          }
          return;
        }
        const data: TourData = await res.json();
        setTourData(data);

        // Set initial point to the first point on the first floor
        if (data.floors.length > 0 && data.floors[0].points.length > 0) {
          setCurrentPoint(data.floors[0].points[0]);
        }
      } catch {
        setError("Failed to load tour");
      } finally {
        setLoading(false);
      }
    }
    fetchTour();
  }, [slug]);

  // Initialize panorama renderer
  useEffect(() => {
    if (!containerRef.current || !currentPoint) return;

    // Clean up previous renderer
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    const renderer = new PanoramaRenderer(containerRef.current);
    rendererRef.current = renderer;

    // Load the panorama
    renderer.loadPanorama(currentPoint.panoramaUrl).catch(() => {
      console.error("Failed to load panorama:", currentPoint.panoramaUrl);
    });

    // Set initial view
    renderer.setView(currentPoint.pitch, currentPoint.yaw, currentPoint.fov);

    // Add hotspots for connected points
    if (tourData) {
      const allConnections = currentPoint.fromConnections;
      const hotspots: HotspotData[] = [];

      for (const conn of allConnections) {
        const targetPoint = tourData.floors
          .flatMap((f) => f.points)
          .find((p) => p.id === conn.toId);
        if (targetPoint) {
          hotspots.push({
            id: `nav-${conn.id}`,
            position: calculateHotspotPosition(targetPoint),
            label: targetPoint.name,
            onClick: () => navigateToPoint(targetPoint),
          });
        }
      }

      hotspots.forEach((h) => renderer.addHotspot(h));
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [currentPoint?.id, tourData]);

  function calculateHotspotPosition(targetPoint: TourPointDB): THREE.Vector3 {
    // Convert yaw/pitch to a 3D position on the sphere
    const phi = (90 - (targetPoint.pitch || 0)) * (Math.PI / 180);
    const theta = ((targetPoint.yaw || 0) + 180) * (Math.PI / 180);
    const radius = 400;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  function navigateToPoint(point: TourPointDB) {
    // Find which floor this point belongs to
    if (tourData) {
      const floorIndex = tourData.floors.findIndex((f) =>
        f.points.some((p) => p.id === point.id)
      );
      if (floorIndex >= 0) {
        setCurrentFloorIndex(floorIndex);
      }
    }
    setCurrentPoint(point);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-lg">Loading tour...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tourData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md px-6">
          <div className="text-6xl mb-4">🔭</div>
          <h1 className="text-2xl font-bold mb-2">Tour Not Found</h1>
          <p className="text-gray-400">
            {error || "This tour does not exist or is not publicly accessible."}
          </p>
        </div>
      </div>
    );
  }

  const currentFloor = tourData.floors[currentFloorIndex];
  const allPoints = tourData.floors.flatMap((f) => f.points);

  return (
    <div className="min-h-screen bg-black relative">
      {/* Panorama Container */}
      <div
        ref={containerRef}
        className="w-full h-screen"
        style={{ cursor: "grab" }}
      />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-white text-xl font-bold">{tourData.name}</h1>
          {tourData.description && (
            <p className="text-white/70 text-sm">{tourData.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setShowInfo(!showInfo)}
          >
            <Info className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && tourData.branding && (
        <div className="absolute top-16 right-4 p-4 bg-black/70 backdrop-blur-sm rounded-lg text-white max-w-xs pointer-events-auto">
          {tourData.branding.companyName && (
            <h3 className="font-semibold text-lg mb-1">
              {tourData.branding.companyName}
            </h3>
          )}
          {tourData.branding.contactInfo && (
            <p className="text-white/70 text-sm">
              {tourData.branding.contactInfo}
            </p>
          )}
          {tourData.branding.logo && (
            <img
              src={tourData.branding.logo}
              alt="Company logo"
              className="mt-2 h-10 object-contain"
            />
          )}
        </div>
      )}

      {/* Current Point Info */}
      {currentPoint && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full pointer-events-none">
          <div className="flex items-center gap-2 text-white text-sm">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">{currentPoint.name}</span>
            {currentFloor && (
              <span className="text-white/50">— {currentFloor.name}</span>
            )}
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        {/* Floor Tabs */}
        {tourData.floors.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-3">
            {tourData.floors.map((floor, index) => (
              <Button
                key={floor.id}
                variant={index === currentFloorIndex ? "default" : "ghost"}
                size="sm"
                className={
                  index === currentFloorIndex
                    ? "bg-white text-black hover:bg-white/90"
                    : "text-white hover:bg-white/20"
                }
                onClick={() => setCurrentFloorIndex(index)}
              >
                {floor.name}
              </Button>
            ))}
          </div>
        )}

        {/* Point Navigation */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => {
              if (!currentFloor) return;
              const currentIndex = currentFloor.points.findIndex(
                (p) => p.id === currentPoint?.id
              );
              if (currentIndex > 0) {
                setCurrentPoint(currentFloor.points[currentIndex - 1]);
              }
            }}
            disabled={
              !currentFloor ||
              currentFloor.points.findIndex(
                (p) => p.id === currentPoint?.id
              ) <= 0
            }
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="flex items-center gap-1.5">
            {currentFloor?.points.map((point, index) => (
              <button
                key={point.id}
                onClick={() => setCurrentPoint(point)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  point.id === currentPoint?.id
                    ? "bg-white scale-125"
                    : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to ${point.name}`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => {
              if (!currentFloor) return;
              const currentIndex = currentFloor.points.findIndex(
                (p) => p.id === currentPoint?.id
              );
              if (currentIndex < currentFloor.points.length - 1) {
                setCurrentPoint(currentFloor.points[currentIndex + 1]);
              }
            }}
            disabled={
              !currentFloor ||
              currentFloor.points.findIndex(
                (p) => p.id === currentPoint?.id
              ) >=
                currentFloor.points.length - 1
            }
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* All Points List */}
        {allPoints.length > 0 && (
          <div className="flex items-center justify-center mt-2 gap-1 flex-wrap">
            {allPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => navigateToPoint(point)}
                className={`px-2 py-0.5 text-xs rounded-full transition-all ${
                  point.id === currentPoint?.id
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {point.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Branding */}
      {tourData.branding?.primaryColor && (
        <style jsx global>{`
          :root {
            --tour-primary: ${tourData.branding.primaryColor};
          }
        `}</style>
      )}
    </div>
  );
}
