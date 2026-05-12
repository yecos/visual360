'use client';

import { motion } from 'framer-motion';

interface CompassWidgetProps {
  yaw: number;
}

export function CompassWidget({ yaw }: CompassWidgetProps) {
  // Normalize yaw to 0-360
  const normalizedYaw = ((yaw % 360) + 360) % 360;

  // Determine cardinal direction
  const getDirection = (angle: number): string => {
    if (angle >= 337.5 || angle < 22.5) return 'N';
    if (angle >= 22.5 && angle < 67.5) return 'NE';
    if (angle >= 67.5 && angle < 112.5) return 'E';
    if (angle >= 112.5 && angle < 157.5) return 'SE';
    if (angle >= 157.5 && angle < 202.5) return 'S';
    if (angle >= 202.5 && angle < 247.5) return 'SW';
    if (angle >= 247.5 && angle < 292.5) return 'W';
    return 'NW';
  };

  const direction = getDirection(normalizedYaw);

  return (
    <div className="flex flex-col items-center">
      <div className="relative size-14 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: -normalizedYaw }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          {/* Compass needle */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-500" />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[6px] border-l-transparent border-r-transparent border-t-white/50" />
        </motion.div>

        {/* Center dot */}
        <div className="absolute size-1.5 rounded-full bg-white" />

        {/* Cardinal labels */}
        <span className="absolute top-0.5 text-[6px] text-red-400 font-bold">N</span>
        <span className="absolute bottom-0.5 text-[6px] text-white/60">S</span>
        <span className="absolute right-0.5 text-[6px] text-white/60">E</span>
        <span className="absolute left-0.5 text-[6px] text-white/60">W</span>
      </div>

      <span className="text-[10px] text-white/80 mt-1 font-medium">{direction}</span>
    </div>
  );
}
