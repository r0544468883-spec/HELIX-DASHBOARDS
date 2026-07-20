import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchGa4Metrics } from '@/lib/connectors/ga4';
import { getValidGoogleToken } from '@/lib/google-token';
import { upsertMetrics } from '@/lib/connectors/upsert';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Pull GA4 metrics for the connected property and upsert into metric_points.
// Body: { propertyId, days? }. Uses the g_token cookie from the OAuth flow.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { propertyId?: string; days?: number };
  const propertyId = (body.propertyId ?? '').replace(/^properties\//, '');
  if (!propertyId) return NextResponse.json({ error: 'property_id_required' }, { status: 400 });

  const token = await getValidGoogleToken();
  if (!token) return NextResponse.json({ error: 'google_not_connected' }, { status: 401 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: mem } = await supabase.from('memberships').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle();
  const ws = mem?.workspace_id as string | undefined;
  if (!ws) return NextResponse.json({ error: 'no_workspace' }, { status: 400 });

  try {
    const points = await fetchGa4Metrics(token, propertyId, body.days ?? 30);
    // Persist propertyId on the connection (merge, keep refresh_token) for cron.
    const { data: conn } = await supabase.from('connections').select('config').eq('workspace_id', ws).eq('provider', 'ga4').maybeSingle();
    await supabase.from('connections').update({ config: { ...(conn?.config ?? {}), propertyId } }).eq('workspace_id', ws).eq('provider', 'ga4');

    const synced = await upsertMetrics(supabase, ws, points);
    return NextResponse.json({ ok: true, synced });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
