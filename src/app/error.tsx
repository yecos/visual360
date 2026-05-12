'use client';

import { Globe, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="rounded-full bg-destructive/10 p-4 inline-flex mb-4">
            <Globe className="size-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred in Visual 360°.
          </p>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-xs font-mono">
            {error.message || 'An unknown error occurred'}
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go Home
          </Button>
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
