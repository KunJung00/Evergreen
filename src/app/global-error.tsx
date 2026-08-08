'use client';

import './globals.css';

/**
 * Catches errors thrown in the root layout itself (BUILD-SPEC §11 Phase 8).
 * Next.js requires this file to render its own complete <html>/<body> — it
 * replaces the root layout entirely, so no next-intl provider is available.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center font-sans text-foreground">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            เกิดข้อผิดพลาดบางอย่าง · Something went wrong
          </h1>
          <p className="text-muted-foreground">
            ขออภัย มีบางอย่างผิดพลาด ลองอีกครั้งได้เลย · Sorry, something broke. You can try again.
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          ลองอีกครั้ง · Try again
        </button>
      </body>
    </html>
  );
}
