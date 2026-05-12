'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Globe, Search, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ProjectCard } from '@/components/dashboard/project-card';
import { useTourProjectStore } from '@/lib/store/tour-project-store';
import { listProjects, saveProject, deleteProject } from '@/lib/storage';
import type { TourProject } from '@/lib/store/tour-project-store';

export default function DashboardPage() {
  const router = useRouter();
  const { createProject, loadProject } = useTourProjectStore();

  const [projects, setProjects] = useState<TourProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load projects from IndexedDB on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const savedProjects = await listProjects();
      setProjects(savedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    createProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
    const project = useTourProjectStore.getState().project;

    if (project) {
      try {
        await saveProject(project);
        toast.success(`Project "${project.name}" created`);
        router.push(`/editor/${project.id}`);
      } catch (error) {
        console.error('Failed to save project:', error);
        toast.error('Failed to save project');
      }
    }
  }, [createProject, newProjectName, newProjectDesc, router]);

  const handleOpenProject = useCallback(async (id: string) => {
    try {
      const { loadProject: loadIntoStore } = useTourProjectStore.getState();
      const project = projects.find((p) => p.id === id);
      if (project) {
        loadIntoStore(project);
        router.push(`/editor/${id}`);
      }
    } catch (error) {
      console.error('Failed to open project:', error);
      toast.error('Failed to open project');
    }
  }, [projects, router]);

  const handleDeleteProject = useCallback(async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success(`Project "${project.name}" deleted`);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  }, [projects]);

  const handleShareProject = useCallback((id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project?.shareSlug) {
      const url = `${window.location.origin}/viewer/${project.shareSlug}`;
      navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard');
    }
  }, [projects]);

  // Filter projects by search query
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Globe className="size-7 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">
                  Visual 360°
                </h1>
              </div>
              <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                Virtual Tour Creator
              </span>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">New Project</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tour Project</DialogTitle>
                  <DialogDescription>
                    Start building your immersive 360° virtual tour.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      placeholder="e.g., Modern Apartment Tour"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateProject();
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="project-desc">Description (optional)</Label>
                    <Textarea
                      id="project-desc"
                      placeholder="Brief description of your virtual tour..."
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject}>Create Project</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar */}
        {projects.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="rounded-full bg-muted p-6 mb-6">
              <LayoutGrid className="size-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No tour projects yet</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Create your first 360° virtual tour project. Upload panorama images,
              build interactive floor plans, and connect viewpoints with seamless navigation.
            </p>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-5" />
              Create Your First Tour
            </Button>
          </motion.div>
        )}

        {/* Projects grid */}
        {!loading && projects.length > 0 && (
          <>
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="size-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No projects match &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
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
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground text-center">
            Visual 360° — Immersive Virtual Tour Creator
          </p>
        </div>
      </footer>
    </div>
  );
}
