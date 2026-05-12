'use client';

import {
  Map,
  Eye,
  Undo2,
  Redo2,
  Plus,
  ZoomIn,
  ZoomOut,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTourProjectStore } from '@/lib/store/tour-project-store';

interface EditorToolbarProps {
  viewMode: 'floorplan' | 'panorama';
  onViewModeChange: (mode: 'floorplan' | 'panorama') => void;
  onSave: () => void;
  saving?: boolean;
}

export function EditorToolbar({ viewMode, onViewModeChange, onSave, saving }: EditorToolbarProps) {
  const { addFloor, undo, redo, canUndo, canRedo } = useTourProjectStore();

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-background border-b">
      {/* View mode toggle */}
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(value) => {
          if (value) onViewModeChange(value as 'floorplan' | 'panorama');
        }}
      >
        <ToggleGroupItem value="floorplan" className="text-xs gap-1.5 h-7">
          <Map className="size-3.5" />
          Floor Plan
        </ToggleGroupItem>
        <ToggleGroupItem value="panorama" className="text-xs gap-1.5 h-7">
          <Eye className="size-3.5" />
          Panorama
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Actions */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={undo}
              disabled={!canUndo()}
            >
              <Undo2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={redo}
              disabled={!canRedo()}
            >
              <Redo2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => {
                const floorNum = useTourProjectStore.getState().project?.floors.length ?? 0;
                addFloor(`Floor ${floorNum + 1}`);
              }}
            >
              <Plus className="size-3.5" />
              Floor
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add New Floor</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={onSave}
              disabled={saving}
            >
              <Save className="size-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save Project</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
