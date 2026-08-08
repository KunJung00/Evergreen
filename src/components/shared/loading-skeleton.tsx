import { cn } from '@/lib/utils';

/** Pulsing placeholder block, composed into per-route `loading.tsx` skeletons. */
export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}
