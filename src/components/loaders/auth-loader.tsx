import { Skeleton } from '@/components/loaders/skeleton';

export default function AuthLoader() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Panel skeleton */}
      <div className="relative hidden flex-col justify-between bg-primary p-10 lg:flex">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 bg-primary-foreground/20" />
          <Skeleton className="h-6 w-24 bg-primary-foreground/20" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-full bg-primary-foreground/20" />
          <Skeleton className="h-5 w-4/5 bg-primary-foreground/20" />
          <Skeleton className="mt-4 h-4 w-48 bg-primary-foreground/20" />
        </div>
      </div>

      {/* Right Panel skeleton */}
      <div className="flex flex-col bg-background">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center">
              <Skeleton className="mx-auto h-8 w-64" />
              <Skeleton className="mx-auto h-4 w-48" />
            </div>

            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-px flex-1" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-px flex-1" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>

            <Skeleton className="mx-auto h-3 w-72" />
          </div>
        </div>
      </div>
    </div>
  );
}
