import { ImageResponse } from 'next/og';

import { siteConfig } from '@/config/site';

export const runtime = 'edge';

/**
 * Dynamic OpenGraph image (BUILD-SPEC §12). Usage: `/api/og?title=...`.
 * Referenced by page metadata `openGraph.images`.
 */
export function GET(request: Request): ImageResponse {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title')?.slice(0, 120) ?? siteConfig.name;

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.7 }}>{siteConfig.name}</div>
      <div style={{ fontSize: 72, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>{title}</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
