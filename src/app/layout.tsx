import type { ReactNode } from 'react';

// Root layout is a passthrough; the <html> document is rendered by
// src/app/[locale]/layout.tsx (next-intl App Router pattern). A root layout
// file must still exist, so this stays minimal.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
