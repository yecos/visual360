'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Globe } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTourProjectStore } from '@/lib/store/tour-project-store';
import { loadProject, saveProject } from '@/lib/storage';
import { ProjectSidebar } from '@/components/editor/project-sidebar';
import { FloorPlanCanvas } from '@/components/editor/floor-plan-canvas';
import { PointEditor } from '@/components/editor/point-editor';
import { EditorToolbar } from '@/components/editor/editor-toolbar';
import { PanoramaEditor } from '@/components/editor/panorama-editor';
import { BrandingPanel } from '@/components/editor/branding-panel';
import { WalkthroughEditor } from '@/components/editor/walkthrough-editor';
import { useIsMobile } from '@/hooks/use-mobile';

type ViewMode = 'floorplan' | 'panorama';
type SidePanel = 'none' | 'branding' | 'walkthrough';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const projectId = params.id as string;

  const { project, loadProject: loadIntoStore, selectPoint } = useTourProjectStore();

  const [viewMode, setViewMode] = useState<ViewMode>('floorplan');
  const [sidePanel, setSidePanel] = useState<SidePanel>('none');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load project from IndexedDB
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const savedProject = await loadProject(projectId);
        if (savedProject) {
          loadIntoStore(savedProject);
        } else {
          toast.error('Project not found');
          router.push('/');
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        toast.error('Failed to load project');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, loadIntoStore, router]);

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

  const handlePointSelect = useCallback(
    (pointId: string) => {
      selectPoint(pointId);
      setViewMode('panorama');
    },
    [selectPoint]
  );

  const handleNavigateToPoint = useCallback(
    (pointId: string) => {
      selectPoint(pointId);
    },
    [selectPoint]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Globe className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Project not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top toolbar */}
      <EditorToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSave={handleSave}
        saving={saving}
      />

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? (
          /* Mobile layout */
          <div className="flex flex-col h-full">
            {/* Canvas / Panorama area */}
            <div className="flex-1 relative">
              {viewMode === 'floorplan' ? (
                <FloorPlanCanvas onPointSelect={handlePointSelect} />
              ) : (
                <PanoramaEditor onNavigateToPoint={handleNavigateToPoint} />
              )}
            </div>

            {/* Bottom sheet for point editor on mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
                >
                  Edit Point
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh]">
                <PointEditor onPanoramaView={() => setViewMode('panorama')} />
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          /* Desktop layout with resizable panels */
          <ResizablePanelGroup direction="horizontal">
            {/* Left sidebar */}
            <ResizablePanel defaultSize={18} minSize={14} maxSize={25}>
              <ProjectSidebar
                onOpenBranding={() => setSidePanel('branding')}
                onOpenWalkthrough={() => setSidePanel('walkthrough')}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center canvas */}
            <ResizablePanel defaultSize={viewMode === 'panorama' ? 60 : 55}>
              {viewMode === 'floorplan' ? (
                <FloorPlanCanvas onPointSelect={handlePointSelect} />
              ) : (
                <PanoramaEditor onNavigateToPoint={handleNavigateToPoint} />
              )}
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right panel */}
            <ResizablePanel defaultSize={27} minSize={20} maxSize={35}>
              {sidePanel === 'branding' ? (
                <BrandingPanel onClose={() => setSidePanel('none')} />
              ) : sidePanel === 'walkthrough' ? (
                <WalkthroughEditor onClose={() => setSidePanel('none')} />
              ) : (
                <PointEditor onPanoramaView={() => setViewMode('panorama')} />
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
