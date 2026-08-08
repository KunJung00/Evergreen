import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { AuditLog, Profile, Subscription } from '@/types';

/**
 * Admin read layer (BUILD-SPEC §7). RLS grants admins full read access via the
 * `public.is_admin()` security-definer function (pitfall P2), so these run on
 * the request-scoped server client — no service role needed for reads.
 *
 * Datasets are returned in full and paginated/sorted/searched client-side by the
 * generic DataTable. A defensive cap keeps a runaway table from flooding memory.
 */
const MAX_ROWS = 1000;

export async function getUsers(): Promise<Profile[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);
  return data ?? [];
}

export async function getUserById(id: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
  return data ?? null;
}

export type SubscriptionRow = Subscription & { userEmail: string | null };

export async function getSubscriptions(): Promise<SubscriptionRow[]> {
  const supabase = createClient();
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);
  if (!subs || subs.length === 0) return [];

  const userIds = Array.from(new Set(subs.map((s) => s.user_id)));
  const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds);
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  return subs.map((s) => ({ ...s, userEmail: emailById.get(s.user_id) ?? null }));
}

export async function getSubscriptionForUser(userId: string): Promise<Subscription | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export type AuditLogRow = AuditLog & { actorEmail: string | null };

export async function getAuditLogs(): Promise<AuditLogRow[]> {
  const supabase = createClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);
  if (!logs || logs.length === 0) return [];

  const actorIds = Array.from(
    new Set(logs.map((l) => l.actor_id).filter((id): id is string => id !== null)),
  );
  const emailById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', actorIds);
    (profiles ?? []).forEach((p) => emailById.set(p.id, p.email));
  }

  return logs.map((l) => ({
    ...l,
    actorEmail: l.actor_id ? (emailById.get(l.actor_id) ?? null) : null,
  }));
}

export type AdminStats = {
  totalUsers: number;
  adminCount: number;
  activeSubscriptions: number;
  auditLogCount: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createClient();
  const [users, admins, activeSubs, logs] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: users.count ?? 0,
    adminCount: admins.count ?? 0,
    activeSubscriptions: activeSubs.count ?? 0,
    auditLogCount: logs.count ?? 0,
  };
}
