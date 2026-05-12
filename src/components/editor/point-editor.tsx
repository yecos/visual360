'use client';

import { useCallback, useRef, useState } from 'react';
import { Trash2, Upload, Link2, Unlink, Image as ImageIcon, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTourProjectStore } from '@/lib/store/tour-project-store';
import { savePanorama, fileToBase64, base64ToDataURL } from '@/lib/storage';

interface PointEditorProps {
  onPanoramaView?: () => void;
}

export function PointEditor({ onPanoramaView }: PointEditorProps) {
  const {
    project,
    selectedFloorId,
    selectedPointId,
    updatePoint,
    removePoint,
    addConnection,
    removeConnection,
    selectPoint,
  } = useTourProjectStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [connectTo, setConnectTo] = useState('');

  const selectedFloor = project?.floors.find((f) => f.id === selectedFloorId);
  const selectedPoint = selectedFloor?.points.find((p) => p.id === selectedPointId);

  const handlePanoramaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !project || !selectedPoint) return;

      try {
        setUploading(true);
        const base64 = await fileToBase64(file);
        const dataUrl = base64ToDataURL(base64, file.type);

        await savePanorama(project.id, selectedPoint.id, base64, file.type, file.name);

        updatePoint(selectedFloorId!, selectedPoint.id, {
          panoramaUrl: dataUrl,
          panoramaType: file.type.startsWith('video') ? 'video' : 'image',
        });

        toast.success('Panorama uploaded');
      } catch (error) {
        console.error('Failed to upload panorama:', error);
        toast.error('Failed to upload panorama');
      } finally {
        setUploading(false);
      }
    },
    [project, selectedPoint, selectedFloorId, updatePoint]
  );

  const handleAddConnection = useCallback(() => {
    if (!selectedFloorId || !selectedPointId || !connectTo || connectTo === selectedPointId) return;

    // Check if connection already exists
    const exists = selectedFloor?.connections.some(
      (c) => c.fromId === selectedPointId && c.toId === connectTo
    );
    if (exists) {
      toast.error('Connection already exists');
      return;
    }

    addConnection(selectedFloorId, selectedPointId, connectTo);
    setConnectTo('');
    toast.success('Connection added');
  }, [selectedFloorId, selectedPointId, connectTo, selectedFloor, addConnection]);

  const handleDeletePoint = useCallback(() => {
    if (!selectedFloorId || !selectedPointId) return;
    removePoint(selectedFloorId, selectedPointId);
    selectPoint(null);
  }, [selectedFloorId, selectedPointId, removePoint, selectPoint]);

  const handleRemoveConnection = useCallback(
    (connectionId: string) => {
      if (!selectedFloorId) return;
      removeConnection(selectedFloorId, connectionId);
    },
    [selectedFloorId, removeConnection]
  );

  if (!selectedPoint || !selectedFloor) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Link2 className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Select a point to edit its properties
        </p>
      </div>
    );
  }

  const otherPoints = selectedFloor.points.filter((p) => p.id !== selectedPoint.id);
  const pointConnections = selectedFloor.connections.filter(
    (c) => c.fromId === selectedPoint.id || c.toId === selectedPoint.id
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label className="text-xs">Name</Label>
          <Input
            value={selectedPoint.name}
            onChange={(e) =>
              updatePoint(selectedFloorId!, selectedPoint.id, { name: e.target.value })
            }
            className="h-8 text-sm"
          />
        </div>

        {/* Panorama Type */}
        <div className="space-y-2">
          <Label className="text-xs">Panorama Type</Label>
          <ToggleGroup
            type="single"
            value={selectedPoint.panoramaType}
            onValueChange={(value) => {
              if (value) {
                updatePoint(selectedFloorId!, selectedPoint.id, {
                  panoramaType: value as 'image' | 'video',
                });
              }
            }}
            className="justify-start"
          >
            <ToggleGroupItem value="image" className="text-xs gap-1.5">
              <ImageIcon className="size-3" />
              Image
            </ToggleGroupItem>
            <ToggleGroupItem value="video" className="text-xs gap-1.5">
              <Video className="size-3" />
              Video
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Panorama Upload */}
        <div className="space-y-2">
          <Label className="text-xs">Panorama</Label>
          {selectedPoint.panoramaUrl ? (
            <div className="relative rounded-md overflow-hidden border bg-muted">
              {selectedPoint.panoramaType === 'image' ? (
                <img
                  src={selectedPoint.panoramaUrl}
                  alt="Panorama preview"
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-24 bg-muted">
                  <Video className="size-8 text-muted-foreground" />
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-1 right-1 h-6 text-[10px] gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3" />
                Replace
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 h-20 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="size-4" />
              {uploading ? 'Uploading...' : 'Upload Panorama'}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={selectedPoint.panoramaType === 'video' ? 'video/*' : 'image/*'}
            className="hidden"
            onChange={handlePanoramaUpload}
          />
          {selectedPoint.panoramaUrl && onPanoramaView && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={onPanoramaView}
            >
              View in Panorama Editor
            </Button>
          )}
        </div>

        <Separator />

        {/* Position */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">Position on Floor Plan</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">X</Label>
                <span className="text-[10px] text-muted-foreground">{selectedPoint.x}</span>
              </div>
              <Slider
                value={[selectedPoint.x]}
                onValueChange={([x]) =>
                  updatePoint(selectedFloorId!, selectedPoint.id, { x })
                }
                min={0}
                max={2000}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">Y</Label>
                <span className="text-[10px] text-muted-foreground">{selectedPoint.y}</span>
              </div>
              <Slider
                value={[selectedPoint.y]}
                onValueChange={([y]) =>
                  updatePoint(selectedFloorId!, selectedPoint.id, { y })
                }
                min={0}
                max={2000}
                step={1}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Camera View */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">Camera View</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">Pitch</Label>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(selectedPoint.pitch)}°
                </span>
              </div>
              <Slider
                value={[selectedPoint.pitch]}
                onValueChange={([pitch]) =>
                  updatePoint(selectedFloorId!, selectedPoint.id, { pitch })
                }
                min={-85}
                max={85}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">Yaw</Label>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(selectedPoint.yaw)}°
                </span>
              </div>
              <Slider
                value={[selectedPoint.yaw]}
                onValueChange={([yaw]) =>
                  updatePoint(selectedFloorId!, selectedPoint.id, { yaw })
                }
                min={-180}
                max={180}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">FOV</Label>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(selectedPoint.fov)}°
                </span>
              </div>
              <Slider
                value={[selectedPoint.fov]}
                onValueChange={([fov]) =>
                  updatePoint(selectedFloorId!, selectedPoint.id, { fov })
                }
                min={30}
                max={110}
                step={1}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Connections */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">Connections</Label>

          {/* Existing connections */}
          {pointConnections.length > 0 && (
            <div className="space-y-1">
              {pointConnections.map((conn) => {
                const isOutgoing = conn.fromId === selectedPoint.id;
                const otherPointId = isOutgoing ? conn.toId : conn.fromId;
                const otherPoint = selectedFloor.points.find((p) => p.id === otherPointId);
                return (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between rounded-md border px-2 py-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      {isOutgoing ? (
                        <Link2 className="size-3 text-blue-500" />
                      ) : (
                        <Link2 className="size-3 text-green-500 rotate-180" />
                      )}
                      <span className="truncate">{otherPoint?.name || 'Unknown'}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {isOutgoing ? '→' : '←'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5"
                      onClick={() => handleRemoveConnection(conn.id)}
                    >
                      <Unlink className="size-3 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add connection */}
          {otherPoints.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={connectTo} onValueChange={setConnectTo}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Connect to..." />
                </SelectTrigger>
                <SelectContent>
                  {otherPoints.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={handleAddConnection}
                disabled={!connectTo}
              >
                <Link2 className="size-3" />
                Add
              </Button>
            </div>
          )}

          {otherPoints.length === 0 && pointConnections.length === 0 && (
            <p className="text-[10px] text-muted-foreground">
              Add more points on the floor plan to create connections.
            </p>
          )}
        </div>

        <Separator />

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-2"
          onClick={handleDeletePoint}
        >
          <Trash2 className="size-3.5" />
          Delete Point
        </Button>
      </div>
    </ScrollArea>
  );
}
