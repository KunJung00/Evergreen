import * as React from 'react';

import { cn } from '@/lib/utils';

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('container mx-auto w-full', className)} {...props} />;
}
