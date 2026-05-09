import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoader() {
  return (
    <Card className="shadow-none border-none">
      <CardHeader className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-5">
        <Skeleton className="h-11 w-full rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-px flex-1" />
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}
