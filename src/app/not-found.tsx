import './globals.css';

/**
 * Root-level 404, outside `[locale]/`. This is what middleware's admin-guard
 * rewrite (`NextResponse.rewrite('/_not-found')`, see src/middleware.ts) hits —
 * that rewrite bypasses locale routing entirely, so no next-intl context is
 * available here. The regular in-app 404 is `src/app/[locale]/not-found.tsx`;
 * this one must stand alone with its own <html>/<body> since the root
 * `src/app/layout.tsx` is a bare passthrough (the real document shell lives in
 * `[locale]/layout.tsx`, which this route never reaches).
 */
export default function RootNotFound() {
  return (
    <html lang="th">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center font-sans text-foreground">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">ไม่พบหน้านี้ · Page not found</h1>
          <p className="text-muted-foreground">
            หน้าที่คุณต้องการอาจถูกย้ายหรือไม่มีอยู่จริง · This page may have moved or doesn&apos;t
            exist.
          </p>
        </div>
        <a href="/" className="text-sm font-medium underline underline-offset-4">
          กลับหน้าแรก · Back home
        </a>
      </body>
    </html>
  );
}
