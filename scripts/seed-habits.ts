/**
 * Seeds ~400 days of random log history onto a new habit for manual testing
 * of the heatmap/stats (FEATURE-SPEC §11 Phase H4). Requires a Supabase
 * instance and an existing user (sign up first).
 *
 * Usage: pnpm db:seed-habits <user-email>
 */
import { createClient } from '@supabase/supabase-js';

import { shiftDate, todayInTz } from '../src/lib/habits/date';
import type { Database } from '../src/types/database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (check .env.local).',
  );
  process.exit(1);
}
if (!email) {
  console.error('Usage: pnpm db:seed-habits <user-email>');
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  if (profileError || !profile) {
    console.error(`No profile found for ${email}. Sign up in the app first.`);
    process.exit(1);
  }

  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .insert({
      user_id: profile.id,
      name: 'Seeded habit',
      icon: '🌱',
      color: 'emerald',
      frequency: 'daily',
      target_per_day: 1,
    })
    .select('id')
    .single();
  if (habitError || !habit) {
    console.error('Could not create seed habit:', habitError?.message);
    process.exit(1);
  }

  const today = todayInTz('UTC');
  const days = 400;
  const rows: Database['public']['Tables']['habit_logs']['Insert'][] = [];
  for (let i = 0; i < days; i++) {
    if (Math.random() > 0.65) continue; // ~65% completion rate
    rows.push({
      habit_id: habit.id,
      user_id: profile.id,
      logged_date: shiftDate(today, -i),
      count: 1,
    });
  }

  const { error: insertError } = await supabase.from('habit_logs').insert(rows);
  if (insertError) {
    console.error('Could not insert logs:', insertError.message);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} logs across ${days} days for habit ${habit.id} (${email}).`);
}

main();
