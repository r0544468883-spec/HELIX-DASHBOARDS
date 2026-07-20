import { NextResponse } from 'next/server';
import { createAdmin } from '@/lib/supabase/admin';
import { workspaceDigest } from '@/lib/digest-data';
import { deliver, type Channel } from '@/lib/channels';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Scheduled digest delivery. Runs hourly; sends each subscription whose hour_utc
// matches the current UTC hour, composing REAL workspace data. Service-role.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided = url.searchParams.get('secret') || req.headers.get('x-cron-secret');
  if (secret && provided !== secret) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const hour = new Date().getUTCHours();
  const admin = createAdmin();
  const { data: subs } = await admin.from('digest_subscriptions').select('workspace_id, department, channel, target, hour_utc').eq('active', true).eq('hour_utc', hour);

  let sent = 0;
  for (const s of subs ?? []) {
    try {
      const text = await workspaceDigest(admin, s.workspace_id as string, s.department as string);
      const ok = await deliver(s.channel as Channel, s.target as string, 'HELIX — סיכום יומי', text);
      if (ok) sent++;
    } catch { /* one failing subscription must not abort the run */ }
  }
  return NextResponse.json({ ok: true, hour, matched: (subs ?? []).length, sent });
}
