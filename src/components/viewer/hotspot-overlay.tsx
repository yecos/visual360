'use client';

import { motion } from 'framer-motion';
import type { Connection, TourPoint } from '@/lib/store/tour-project-store';

interface HotspotOverlayProps {
  connections: Connection[];
  points: TourPoint[];
  currentPointId: string;
  onNavigate: (pointId: string) => void;
}

interface HotspotItem {
  id: string;
  label: string;
  pointId: string;
  // 2D projected position as percentage
  x: number;
  y: number;
}

export function HotspotOverlay({
  connections,
  points,
  currentPointId,
  onNavigate,
}: HotspotOverlayProps) {
  // Get connected points from current point
  const connectedPointIds = connections
    .filter((c) => c.fromId === currentPointId || c.toId === currentPointId)
    .map((c) => (c.fromId === currentPointId ? c.toId : c.fromId));

  const hotspots: HotspotItem[] = connectedPointIds
    .map((pid) => {
      const point = points.find((p) => p.id === pid);
      if (!point) return null;
      return {
        id: pid,
        label: point.name,
        pointId: pid,
        // These are approximate positions — the real positioning would use
        // the 3D-to-2D projection from the panorama renderer.
        // For now, distribute around the center
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40,
      };
    })
    .filter(Boolean) as HotspotItem[];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {hotspots.map((hotspot, index) => (
        <motion.button
          key={hotspot.id}
          className="absolute pointer-events-auto flex flex-col items-center gap-1 group"
          style={{
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          onClick={() => onNavigate(hotspot.pointId)}
          aria-label={`Navigate to ${hotspot.label}`}
        >
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />

          {/* Hotspot marker */}
          <span className="relative flex items-center justify-center size-10 rounded-full bg-white/90 shadow-lg border-2 border-white group-hover:bg-white transition-colors">
            <svg
              viewBox="0 0 24 24"
              className="size-5 text-gray-800"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>

          {/* Label */}
          <span className="px-2 py-0.5 rounded bg-black/70 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {hotspot.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
