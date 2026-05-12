import { Globe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center max-w-md p-6">
        <div className="rounded-full bg-muted p-6 inline-flex mb-6">
          <Globe className="size-16 text-muted-foreground" />
        </div>

        <h1 className="text-6xl font-bold mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-3">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Return to Visual 360° to continue creating immersive virtual tours.
        </p>

        <Link href="/">
          <Button className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
