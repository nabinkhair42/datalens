import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoader() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Panel skeleton */}
      <div className="relative hidden flex-col overflow-hidden border-r p-10 lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-7" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Center headline */}
        <div className="my-auto space-y-4 py-20">
          <div className="space-y-2">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>

        {/* Supported databases */}
        <div className="space-y-4">
          <Skeleton className="h-3 w-36" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-11 w-36 rounded-lg" />
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
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

        <div className="flex flex-1 items-center justify-center px-6 md:px-8">
          <div className="w-full max-w-sm space-y-10 p-8 md:p-10">
            <div className="space-y-3">
              <Skeleton className="h-9 w-52" />
              <Skeleton className="h-5 w-64" />
            </div>

            <div className="space-y-5">
              <Skeleton className="h-11 w-full rounded-lg" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-px flex-1" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-px flex-1" />
              </div>
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
