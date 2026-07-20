import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { fetchGa4Metrics } from '@/lib/connectors/ga4';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Pull GA4 metrics for the connected property and upsert into metric_points.
// Body: { propertyId, days? }. Uses the g_token cookie from the OAuth flow.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { propertyId?: string; days?: number };
  const propertyId = (body.propertyId ?? '').replace(/^properties\//, '');
  if (!propertyId) return NextResponse.json({ error: 'property_id_required' }, { status: 400 });

  const token = (await cookies()).get('g_token')?.value;
  if (!token) return NextResponse.json({ error: 'google_not_connected' }, { status: 401 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: mem } = await supabase.from('memberships').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle();
  const ws = mem?.workspace_id as string | undefined;
  if (!ws) return NextResponse.json({ error: 'no_workspace' }, { status: 400 });

  try {
    const points = await fetchGa4Metrics(token, propertyId, body.days ?? 30);
    // Persist the property id on the connection for later scheduled syncs.
    await supabase.from('connections').update({ config: { propertyId } }).eq('workspace_id', ws).eq('provider', 'ga4');

    const rows = points.map((p) => ({ workspace_id: ws, source: p.source, metric: p.metric, dims: p.dims, ts: p.ts, value: p.value }));
    // Chunked upsert on the unique key so re-syncs update in place.
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from('metric_points').upsert(rows.slice(i, i + 500), { onConflict: 'workspace_id,source,metric,dims,ts' });
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({ ok: true, synced: rows.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
