'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Globe2,
  Layers3,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  Sparkles,
  LogOut,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { signOut, useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ProjectCard } from '@/components/dashboard/project-card';
import { useTourProjectStore } from '@/lib/store/tour-project-store';
import { deleteProject, listProjects, saveProject } from '@/lib/storage';
import type { TourProject } from '@/lib/store/tour-project-store';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { createProject } = useTourProjectStore();

  const [projects, setProjects] = useState<TourProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const savedProjects = await listProjects();
      setProjects(savedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('No fue posible cargar los proyectos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (status === 'authenticated') {
      void loadProjects();
    }
  }, [loadProjects, router, status]);

  const stats = useMemo(() => {
    const totalFloors = projects.reduce((sum, project) => sum + project.floors.length, 0);
    const totalPoints = projects.reduce(
      (sum, project) =>
        sum + project.floors.reduce((floorSum, floor) => floorSum + floor.points.length, 0),
      0
    );
    const published = projects.filter((project) => project.isPublic).length;

    return {
      totalProjects: projects.length,
      totalFloors,
      totalPoints,
      published,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim()) {
      toast.error('Escribe un nombre para el proyecto');
      return;
    }

    createProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
    const project = useTourProjectStore.getState().project;

    if (!project) return;

    try {
      await saveProject(project);
      toast.success(`Proyecto “${project.name}” creado`);
      setDialogOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      router.push(`/editor/${project.id}`);
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('No fue posible crear el proyecto');
    }
  }, [createProject, newProjectDesc, newProjectName, router]);

  const handleOpenProject = useCallback(
    (id: string) => {
      const project = projects.find((item) => item.id === id);
      if (!project) return;

      useTourProjectStore.getState().loadProject(project);
      router.push(`/editor/${id}`);
    },
    [projects, router]
  );

  const handleDeleteProject = useCallback(
    async (id: string) => {
      const project = projects.find((item) => item.id === id);
      if (!project) return;

      try {
        await deleteProject(id);
        setProjects((current) => current.filter((item) => item.id !== id));
        toast.success(`Proyecto “${project.name}” eliminado`);
      } catch (error) {
        console.error('Failed to delete project:', error);
        toast.error('No fue posible eliminar el proyecto');
      }
    },
    [projects]
  );

  const handleShareProject = useCallback(
    (id: string) => {
      const project = projects.find((item) => item.id === id);
      if (!project?.shareSlug) return;

      const url = `${window.location.origin}/tour/${project.shareSlug}`;
      void navigator.clipboard.writeText(url);
      toast.success('Enlace público copiado');
    },
    [projects]
  );

  return (
    <div className="min-h-screen bg-[#f5f2ec] text-zinc-950 dark:bg-[#0a0a0a] dark:text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f5f2ec]/90 backdrop-blur-xl dark:border-white/10 dark:bg-black/80">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-2xl bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950">
              <Globe2 className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight">Visual360</h1>
                <span className="rounded-full border border-black/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:border-white/10">
                  Studio
                </span>
              </div>
              <p className="hidden text-[11px] text-zinc-500 sm:block">
                Experiencias inmersivas para arquitectura y espacios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300 sm:flex">
              <UserRound className="size-3.5" />
              <span className="max-w-[180px] truncate">
                {session?.user?.name || session?.user?.email || 'Usuario'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Cerrar sesión"
              onClick={() => void signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="size-4" />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 rounded-full bg-zinc-950 px-4 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                <Plus className="mr-2 size-4" />
                Nuevo proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Crear un nuevo tour</DialogTitle>
                <DialogDescription>
                  Empieza con un proyecto vacío y agrega planos, panoramas 360 y conexiones.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-3">
                <div className="grid gap-2">
                  <Label htmlFor="project-name">Nombre del proyecto</Label>
                  <Input
                    id="project-name"
                    placeholder="Ej. Apartamento Calleja 043"
                    value={newProjectName}
                    onChange={(event) => setNewProjectName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void handleCreateProject();
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project-desc">Descripción</Label>
                  <Textarea
                    id="project-desc"
                    placeholder="Una descripción corta para identificar el tour..."
                    value={newProjectDesc}
                    onChange={(event) => setNewProjectDesc(event.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => void handleCreateProject()}>
                  Crear proyecto
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] px-4 pb-14 pt-7 sm:px-6 lg:px-8 lg:pt-10">
        <section className="relative overflow-hidden rounded-[36px] border border-black/5 bg-zinc-950 px-6 py-8 text-white shadow-[0_35px_120px_-55px_rgba(0,0,0,0.75)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(255,255,255,0.14),transparent_22%),radial-gradient(circle_at_90%_20%,rgba(217,186,140,0.15),transparent_25%),linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.03),transparent_70%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur">
                <Sparkles className="size-3.5" />
                Workspace inmersivo
              </div>
              <h2 className="max-w-3xl text-3xl font-semibold leading-[1.06] tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                Diseña recorridos 360 que se sientan como una presentación premium.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                Organiza niveles, ubica puntos sobre el plano, conecta panoramas y publica
                recorridos listos para presentar a clientes.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="rounded-full bg-white px-5 text-zinc-950 hover:bg-zinc-100"
                  onClick={() => setDialogOpen(true)}
                >
                  Crear tour
                  <ArrowUpRight className="ml-2 size-4" />
                </Button>
                <div className="flex items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-white/60">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  {stats.published} publicados
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {[
                { label: 'Proyectos', value: stats.totalProjects, icon: LayoutGrid },
                { label: 'Niveles', value: stats.totalFloors, icon: Layers3 },
                { label: 'Puntos 360', value: stats.totalPoints, icon: MapPin },
                { label: 'Públicos', value: stats.published, icon: Globe2 },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-[24px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm"
                >
                  <Icon className="mb-5 size-4 text-white/45" />
                  <div className="text-2xl font-semibold tracking-tight">{value}</div>
                  <div className="mt-1 text-xs text-white/45">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Biblioteca
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">
                Tus proyectos
              </h2>
            </div>

            {projects.length > 0 && (
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Buscar proyecto..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-11 rounded-full border-black/10 bg-white pl-10 shadow-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </div>
            )}
          </div>

          {loading && (
            <div className="grid min-h-[260px] place-items-center rounded-[32px] border border-black/5 bg-white/55 dark:border-white/10 dark:bg-white/[0.025]">
              <div className="flex flex-col items-center gap-3 text-zinc-500">
                <div className="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
                <p className="text-sm">Cargando proyectos…</p>
              </div>
            </div>
          )}

          {!loading && projects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid min-h-[360px] place-items-center rounded-[32px] border border-dashed border-black/10 bg-white/55 p-8 text-center dark:border-white/10 dark:bg-white/[0.025]"
            >
              <div className="max-w-md">
                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  <LayoutGrid className="size-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Crea tu primer recorrido 360
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Sube panoramas, ubícalos sobre el plano y conecta cada espacio en una
                  experiencia navegable.
                </p>
                <Button className="mt-6 rounded-full" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Nuevo proyecto
                </Button>
              </div>
            </motion.div>
          )}

          {!loading && projects.length > 0 && filteredProjects.length === 0 && (
            <div className="grid min-h-[220px] place-items-center rounded-[32px] border border-black/5 bg-white/55 text-center dark:border-white/10 dark:bg-white/[0.025]">
              <div>
                <Search className="mx-auto mb-3 size-7 text-zinc-400" />
                <p className="text-sm text-muted-foreground">
                  No encontramos proyectos para “{searchQuery}”.
                </p>
              </div>
            </div>
          )}

          {!loading && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProjectCard
                      project={project}
                      onOpen={handleOpenProject}
                      onDelete={handleDeleteProject}
                      onShare={handleShareProject}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
