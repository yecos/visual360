'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Undo2,
  Redo2,
  Share2,
  Globe,
  Building2,
  MapPin,
  Settings,
  Palette,
  Play,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTourProjectStore } from '@/lib/store/tour-project-store';
import { saveProject } from '@/lib/storage';

interface ProjectSidebarProps {
  onOpenBranding: () => void;
  onOpenWalkthrough: () => void;
}

export function ProjectSidebar({ onOpenBranding, onOpenWalkthrough }: ProjectSidebarProps) {
  const router = useRouter();
  const {
    project,
    selectedFloorId,
    selectedPointId,
    addFloor,
    removeFloor,
    selectFloor,
    selectPoint,
    updateProjectInfo,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTourProjectStore();

  const [floorsOpen, setFloorsOpen] = useState(true);
  const [pointsOpen, setPointsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedFloor = project?.floors.find((f) => f.id === selectedFloorId);

  const handleSave = useCallback(async () => {
    if (!project) return;
    try {
      setSaving(true);
      await saveProject(project);
      toast.success('Project saved');
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    } finally {
      setSaving(false);
    }
  }, [project]);

  const handleShare = useCallback(() => {
    if (!project) return;
    const slug = project.shareSlug || project.id;
    useTourProjectStore.getState().updateProjectInfo({ shareSlug: slug, isPublic: true });
    const url = `${window.location.origin}/viewer/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard');
  }, [project]);

  const handleStartEdit = useCallback(() => {
    if (!project) return;
    setEditName(project.name);
    setEditDesc(project.description || '');
    setIsEditing(true);
  }, [project]);

  const handleFinishEdit = useCallback(() => {
    if (!project) return;
    updateProjectInfo({
      name: editName.trim() || project.name,
      description: editDesc.trim() || undefined,
    });
    setIsEditing(false);
  }, [project, editName, editDesc, updateProjectInfo]);

  const handleAddFloor = useCallback(() => {
    const floorNum = (project?.floors.length || 0) + 1;
    addFloor(`Floor ${floorNum}`);
  }, [project, addFloor]);

  if (!project) return null;

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header with project info */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="h-7 text-sm font-semibold"
              autoFocus
            />
          ) : (
            <h2
              className="text-sm font-semibold truncate cursor-pointer hover:text-primary transition-colors"
              onClick={handleStartEdit}
              title="Click to edit"
            >
              {project.name}
            </h2>
          )}
          <div className="flex items-center gap-1">
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
            </TooltipProvider>
          </div>
        </div>

        {project.description && !isEditing && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {project.description}
          </p>
        )}

        {isEditing && (
          <Textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Project description..."
            className="text-xs min-h-[60px] mb-2"
            rows={2}
          />
        )}

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 h-7 text-xs"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="size-3" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 h-7 text-xs"
            onClick={handleShare}
          >
            <Share2 className="size-3" />
            Share
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Floors section */}
          <Collapsible open={floorsOpen} onOpenChange={setFloorsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
              <div className="flex items-center gap-2">
                {floorsOpen ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <Building2 className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Floors</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {project.floors.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddFloor();
                }}
              >
                <Plus className="size-3" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 space-y-0.5 pl-2">
                {project.floors.map((floor) => (
                  <div
                    key={floor.id}
                    className={`flex items-center justify-between group rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                      selectedFloorId === floor.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => selectFloor(floor.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm truncate">{floor.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {floor.points.length} pts
                      </span>
                    </div>
                    {project.floors.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFloor(floor.id);
                        }}
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Points section */}
          <Collapsible open={pointsOpen} onOpenChange={setPointsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
              <div className="flex items-center gap-2">
                {pointsOpen ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <MapPin className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Points
                  {selectedFloor && ` — ${selectedFloor.name}`}
                </span>
                {selectedFloor && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {selectedFloor.points.length}
                  </Badge>
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 space-y-0.5 pl-2">
                {selectedFloor && selectedFloor.points.length > 0 ? (
                  selectedFloor.points.map((point) => (
                    <div
                      key={point.id}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                        selectedPointId === point.id
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => selectPoint(point.id)}
                    >
                      <MapPin className="size-3 shrink-0" />
                      <span className="text-sm truncate">{point.name}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 ml-auto shrink-0"
                      >
                        {point.panoramaType}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground px-2 py-2">
                    {selectedFloor
                      ? 'Click on the floor plan to add points'
                      : 'Select a floor to see points'}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Tools section */}
          <div className="space-y-1">
            <button
              className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors"
              onClick={onOpenBranding}
            >
              <Palette className="size-4 text-muted-foreground" />
              Branding
            </button>
            <button
              className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors"
              onClick={onOpenWalkthrough}
            >
              <Play className="size-4 text-muted-foreground" />
              Walkthrough
            </button>
            <button
              className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors"
              onClick={() => {
                if (project) {
                  router.push(`/viewer/${project.shareSlug || project.id}`);
                }
              }}
            >
              <Globe className="size-4 text-muted-foreground" />
              Preview Tour
            </button>
          </div>
        </div>
      </ScrollArea>

      {/* Bottom info */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Settings className="size-3" />
          <span>
            {project.floors.reduce((s, f) => s + f.points.length, 0)} points ·{' '}
            {project.floors.reduce((s, f) => s + f.connections.length, 0)} connections
          </span>
        </div>
      </div>
    </div>
  );
}
