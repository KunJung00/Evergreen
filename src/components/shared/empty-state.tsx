import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

/** Generic empty-state block (BUILD-SPEC §3 `shared/empty-state.tsx`). */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-16 text-center">
      {Icon ? <Icon className="mb-2 size-8 text-muted-foreground" /> : null}
      <p className="font-medium">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
