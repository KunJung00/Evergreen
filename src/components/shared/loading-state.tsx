import { Loader2 } from 'lucide-react';

/** Generic centered spinner for a route group's `loading.tsx` fallback. */
export function LoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
