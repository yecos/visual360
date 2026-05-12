'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Globe, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadProject } from '@/lib/storage';
import { TourViewer } from '@/components/viewer/tour-viewer';
import type { TourProject } from '@/lib/store/tour-project-store';

export default function ViewerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.id as string;

  const [project, setProject] = useState<TourProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // Try loading by ID first
        let savedProject = await loadProject(slug);

        // If not found, try matching by shareSlug
        if (!savedProject) {
          const { listProjects } = await import('@/lib/storage');
          const allProjects = await listProjects();
          savedProject = allProjects.find((p) => p.shareSlug === slug) || null;
        }

        if (savedProject) {
          setProject(savedProject);
        } else {
          setError('Tour not found');
        }
      } catch (err) {
        console.error('Failed to load tour:', err);
        setError('Failed to load tour');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-white/60" />
          <p className="text-sm text-white/60">Loading tour...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Globe className="size-16 text-white/20 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            {error || 'Tour not found'}
          </h1>
          <p className="text-white/40 mb-6">
            The virtual tour you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      <TourViewer project={project} />
    </div>
  );
}
