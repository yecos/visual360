'use client';

import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface WalkthroughControlsProps {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  interval: number;
  autoplay: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onIntervalChange: (interval: number) => void;
  onAutoplayToggle: () => void;
}

export function WalkthroughControls({
  isPlaying,
  currentStep,
  totalSteps,
  interval,
  autoplay,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
  onIntervalChange,
  onAutoplayToggle,
}: WalkthroughControlsProps) {
  if (totalSteps === 0) return null;

  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 p-3 space-y-2">
      {/* Progress bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/60 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step info */}
      <div className="flex items-center justify-between text-[10px] text-white/60">
        <span>
          {currentStep + 1} / {totalSteps}
        </span>
        <span>{interval}s interval</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={onReset}
        >
          <RotateCcw className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={onPrev}
          disabled={currentStep <= 0}
        >
          <SkipBack className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 text-white hover:bg-white/10 rounded-full border border-white/20"
          onClick={isPlaying ? onPause : onPlay}
        >
          {isPlaying ? (
            <Pause className="size-5" />
          ) : (
            <Play className="size-5 ml-0.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={onNext}
          disabled={currentStep >= totalSteps - 1}
        >
          <SkipForward className="size-3.5" />
        </Button>
      </div>

      {/* Interval slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-white/40">Speed</span>
          <span className="text-[9px] text-white/40">{interval}s</span>
        </div>
        <Slider
          value={[interval]}
          onValueChange={([v]) => onIntervalChange(v)}
          min={1}
          max={30}
          step={1}
          className="w-full [&_[role=slider]]:size-3 [&_[role=slider]]:border-0"
        />
      </div>
    </div>
  );
}
