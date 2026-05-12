'use client';

import { useCallback, useState } from 'react';
import { X, GripVertical, ChevronUp, ChevronDown, Play, Pause, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTourProjectStore } from '@/lib/store/tour-project-store';

interface WalkthroughEditorProps {
  onClose: () => void;
  onPreview?: () => void;
}

function SortablePointItem({
  pointId,
  pointName,
  onRemove,
}: {
  pointId: string;
  pointName: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pointId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border px-2 py-1.5 bg-background"
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none p-0.5 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="text-sm flex-1 truncate">{pointName}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={onRemove}
      >
        <Trash2 className="size-3 text-destructive" />
      </Button>
    </div>
  );
}

export function WalkthroughEditor({ onClose, onPreview }: WalkthroughEditorProps) {
  const { project, selectedFloorId, updateWalkthrough } = useTourProjectStore();
  const walkthrough = project?.walkthrough;

  const selectedFloor = project?.floors.find((f) => f.id === selectedFloorId);
  const allPoints = project?.floors.flatMap((f) => f.points) || [];

  const [addPointId, setAddPointId] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!walkthrough) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = walkthrough.pointIds.indexOf(active.id as string);
      const newIndex = walkthrough.pointIds.indexOf(over.id as string);
      const newOrder = arrayMove(walkthrough.pointIds, oldIndex, newIndex);
      updateWalkthrough({ pointIds: newOrder });
    },
    [walkthrough, updateWalkthrough]
  );

  const handleAddPoint = useCallback(() => {
    if (!addPointId || !walkthrough) return;
    if (walkthrough.pointIds.includes(addPointId)) return;
    updateWalkthrough({ pointIds: [...walkthrough.pointIds, addPointId] });
    setAddPointId('');
  }, [addPointId, walkthrough, updateWalkthrough]);

  const handleRemovePoint = useCallback(
    (pointId: string) => {
      if (!walkthrough) return;
      updateWalkthrough({
        pointIds: walkthrough.pointIds.filter((id) => id !== pointId),
      });
    },
    [walkthrough, updateWalkthrough]
  );

  const handleMovePoint = useCallback(
    (pointId: string, direction: 'up' | 'down') => {
      if (!walkthrough) return;
      const index = walkthrough.pointIds.indexOf(pointId);
      if (index === -1) return;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= walkthrough.pointIds.length) return;
      const newOrder = arrayMove(walkthrough.pointIds, index, newIndex);
      updateWalkthrough({ pointIds: newOrder });
    },
    [walkthrough, updateWalkthrough]
  );

  if (!project || !walkthrough) return null;

  const availablePoints = allPoints.filter((p) => !walkthrough.pointIds.includes(p.id));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold">Walkthrough Editor</h3>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Add point */}
          <div className="space-y-2">
            <Label className="text-xs">Add Point to Walkthrough</Label>
            <div className="flex items-center gap-2">
              <Select value={addPointId} onValueChange={setAddPointId}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Select a point..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePoints.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={handleAddPoint}
                disabled={!addPointId}
              >
                Add
              </Button>
            </div>
            {availablePoints.length === 0 && (
              <p className="text-[10px] text-muted-foreground">
                All points are already in the walkthrough, or no points exist.
              </p>
            )}
          </div>

          <Separator />

          {/* Point order */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Tour Order</Label>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {walkthrough.pointIds.length} stops
              </Badge>
            </div>

            {walkthrough.pointIds.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={walkthrough.pointIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {walkthrough.pointIds.map((pointId, index) => {
                      const point = allPoints.find((p) => p.id === pointId);
                      return (
                        <div key={pointId} className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground w-4 text-center shrink-0">
                            {index + 1}
                          </span>
                          <SortablePointItem
                            pointId={pointId}
                            pointName={point?.name || 'Unknown Point'}
                            onRemove={() => handleRemovePoint(pointId)}
                          />
                          <div className="flex flex-col shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-4"
                              onClick={() => handleMovePoint(pointId, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-4"
                              onClick={() => handleMovePoint(pointId, 'down')}
                              disabled={index === walkthrough.pointIds.length - 1}
                            >
                              <ChevronDown className="size-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Add points to create a walkthrough sequence.
              </p>
            )}
          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Settings</Label>

            {/* Autoplay */}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Autoplay</Label>
              <Switch
                checked={walkthrough.autoplay}
                onCheckedChange={(autoplay) => updateWalkthrough({ autoplay })}
              />
            </div>

            {/* Interval */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Interval</Label>
                <span className="text-[10px] text-muted-foreground">
                  {walkthrough.interval}s
                </span>
              </div>
              <Slider
                value={[walkthrough.interval]}
                onValueChange={([interval]) => updateWalkthrough({ interval })}
                min={1}
                max={30}
                step={1}
              />
            </div>
          </div>

          <Separator />

          {/* Preview */}
          {onPreview && walkthrough.pointIds.length > 0 && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onPreview}
            >
              <Play className="size-4" />
              Preview Walkthrough
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
