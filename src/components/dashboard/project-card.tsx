'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpRight,
  Building2,
  Eye,
  Layers3,
  MapPin,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import type { TourProject } from '@/lib/store/tour-project-store';

interface ProjectCardProps {
  project: TourProject;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}

export function ProjectCard({ project, onOpen, onDelete, onShare }: ProjectCardProps) {
  const totalPoints = project.floors.reduce((sum, floor) => sum + floor.points.length, 0);
  const totalConnections = project.floors.reduce(
    (sum, floor) => sum + floor.connections.length,
    0
  );

  return (
    <article
      className="group relative overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_20px_70px_-40px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_-38px_rgba(15,23,42,0.42)] dark:border-white/10 dark:bg-zinc-950"
      onClick={() => onOpen(project.id)}
    >
      <div className="relative aspect-[16/10] cursor-pointer overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(120,113,108,0.18),_transparent_42%),linear-gradient(145deg,#f6f4ef,#e7e2d8)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_40%),linear-gradient(145deg,#18181b,#09090b)]">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-zinc-500">
              <div className="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <Building2 className="size-8" />
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.18em]">
                Sin portada
              </span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge className="border-white/20 bg-black/30 text-white backdrop-blur-md hover:bg-black/30">
            {project.floors.length} {project.floors.length === 1 ? 'nivel' : 'niveles'}
          </Badge>
          {project.isPublic && (
            <Badge className="border-emerald-300/20 bg-emerald-500/20 text-emerald-50 backdrop-blur-md hover:bg-emerald-500/20">
              <Eye className="mr-1 size-3" />
              Público
            </Badge>
          )}
        </div>

        <div
          className="absolute right-4 top-4"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="size-9 rounded-full border border-white/20 bg-black/35 text-white shadow-sm backdrop-blur-md hover:bg-black/50 hover:text-white"
                aria-label="Abrir acciones del proyecto"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onOpen(project.id)}>
                <Pencil className="mr-2 size-4" />
                Abrir editor
              </DropdownMenuItem>
              {project.isPublic && project.shareSlug && (
                <DropdownMenuItem onClick={() => onShare(project.id)}>
                  <Share2 className="mr-2 size-4" />
                  Copiar enlace
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="mr-2 size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">
              Tour 360
            </p>
            <h3 className="truncate text-lg font-semibold tracking-tight text-white">
              {project.name}
            </h3>
          </div>
          <div className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <ArrowUpRight className="size-4" />
          </div>
        </div>
      </div>

      <div className="cursor-pointer p-5">
        {project.description ? (
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
            {project.description}
          </p>
        ) : (
          <p className="min-h-10 text-sm leading-5 text-muted-foreground/65">
            Proyecto listo para agregar panoramas, puntos y navegación.
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-zinc-50 px-3 py-3 dark:bg-white/[0.04]">
            <Layers3 className="mb-2 size-4 text-zinc-500" />
            <div className="text-sm font-semibold">{project.floors.length}</div>
            <div className="text-[11px] text-muted-foreground">Niveles</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 px-3 py-3 dark:bg-white/[0.04]">
            <MapPin className="mb-2 size-4 text-zinc-500" />
            <div className="text-sm font-semibold">{totalPoints}</div>
            <div className="text-[11px] text-muted-foreground">Puntos</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 px-3 py-3 dark:bg-white/[0.04]">
            <Share2 className="mb-2 size-4 text-zinc-500" />
            <div className="text-sm font-semibold">{totalConnections}</div>
            <div className="text-[11px] text-muted-foreground">Enlaces</div>
          </div>
        </div>
      </div>
    </article>
  );
}
