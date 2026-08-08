'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Horizontally scrollable wrapper, scrolled to the end (most recent weeks) on mount. */
export function HeatmapScrollContainer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollLeft = ref.current.scrollWidth;
    }
  }, []);

  return (
    <div ref={ref} className="overflow-x-auto pb-1">
      {children}
    </div>
  );
}
