import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Health check endpoint (BUILD-SPEC §14). Returns 200 when the app can reach
 * the database, 503 otherwise. Used by uptime monitors / load balancers.
 */
export async function GET(): Promise<NextResponse> {
  const startedAt = Date.now();

  try {
    const supabase = createClient();
    // Cheap round-trip that respects RLS — HEAD count on a public-safe table.
    const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    if (error) throw error;

    return NextResponse.json({
      status: 'ok',
      db: 'up',
      latencyMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed', error);
    return NextResponse.json(
      { status: 'error', db: 'down', time: new Date().toISOString() },
      { status: 503 },
    );
  }
}
