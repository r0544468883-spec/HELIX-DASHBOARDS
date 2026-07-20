import { NextResponse } from 'next/server';
import { createAdmin } from '@/lib/supabase/admin';
import { runConnector } from '@/lib/connectors/registry';
import { upsertMetrics } from '@/lib/connectors/upsert';
import type { ConnectorConfig } from '@/lib/connectors/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Scheduled sync — refreshes metric_points for every connected connection using
// its stored config. Headless: uses the service-role client (bypasses RLS).
// Protect with CRON_SECRET (Vercel Cron header or ?secret=). Configure Vercel
// Cron to hit this daily.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided = url.searchParams.get('secret') || req.headers.get('x-cron-secret');
  if (secret && provided !== secret) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = createAdmin();
  const { data: conns } = await supabase.from('connections').select('workspace_id, provider, config').eq('status', 'connected');

  const results: { workspace: string; provider: string; synced: number }[] = [];
  for (const c of conns ?? []) {
    const points = await runConnector(c.provider as string, (c.config ?? {}) as ConnectorConfig);
    if (!points.length) continue;
    try {
      const synced = await upsertMetrics(supabase, c.workspace_id as string, points);
      results.push({ workspace: c.workspace_id as string, provider: c.provider as string, synced });
    } catch {
      // one failing connection must not abort the whole cron pass
    }
  }
  return NextResponse.json({ ok: true, connections: (conns ?? []).length, results });
}
