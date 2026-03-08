import { ArrowRightIcon, DatabaseIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <DatabaseIcon className="size-12 text-primary" />
          <h1 className="text-4xl font-bold">DataLens</h1>
        </div>

        <p className="mb-8 text-lg text-muted-foreground">The web-native database IDE</p>

        <Button size="lg" asChild>
          <Link href="/login" className="flex items-center gap-2">
            Get Started
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
