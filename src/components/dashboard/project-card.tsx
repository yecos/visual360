'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MapPin, Building2, MoreVertical, Pencil, Trash2, Eye, Share2 } from 'lucide-react';
import type { TourProject } from '@/lib/store/tour-project-store';

interface ProjectCardProps {
  project: TourProject;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}

export function ProjectCard({ project, onOpen, onDelete, onShare }: ProjectCardProps) {
  const totalPoints = project.floors.reduce((sum, f) => sum + f.points.length, 0);
  const totalConnections = project.floors.reduce((sum, f) => sum + f.connections.length, 0);

  return (
    <Card
      className="group relative cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
      onClick={() => onOpen(project.id)}
    >
      {/* Thumbnail area */}
      <div className="relative h-40 bg-gradient-to-br from-muted to-muted/60 rounded-t-xl overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Building2 className="size-12 opacity-30" />
              <span className="text-xs opacity-50">No thumbnail</span>
            </div>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Pencil className="size-3.5" />
              Open Editor
            </Button>
          </div>
        </div>

        {/* Actions dropdown */}
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="size-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen(project.id)}>
                <Pencil className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {project.isPublic && project.shareSlug && (
                <DropdownMenuItem onClick={() => onShare(project.id)}>
                  <Share2 className="size-4 mr-2" />
                  Copy Share Link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badge */}
        {project.isPublic && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
          >
            <Eye className="size-3 mr-1" />
            Public
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-1">{project.name}</CardTitle>
        {project.description && (
          <CardDescription className="line-clamp-2 text-xs">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Building2 className="size-3" />
            {project.floors.length} floor{project.floors.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {totalPoints} point{totalPoints !== 1 ? 's' : ''}
          </span>
          {totalConnections > 0 && (
            <span className="flex items-center gap-1">
              <Share2 className="size-3" />
              {totalConnections}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
