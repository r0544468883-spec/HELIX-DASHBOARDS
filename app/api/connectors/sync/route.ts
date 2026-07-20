import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runConnector, LIVE_PROVIDERS } from '@/lib/connectors/registry';
import { upsertMetrics } from '@/lib/connectors/upsert';
import type { ConnectorConfig } from '@/lib/connectors/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Generic sync for key-based connectors (meta_ads / stripe / shopify). Stores the
// provided credentials on the connection (for cron reuse) then pulls + upserts.
// GA4 uses its own OAuth route. Body: { provider, config, days? }.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { provider?: string; config?: ConnectorConfig; days?: number };
  const provider = body.provider ?? '';
  if (!LIVE_PROVIDERS.includes(provider as typeof LIVE_PROVIDERS[number]) || provider === 'ga4') {
    return NextResponse.json({ error: 'unsupported_provider' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: mem } = await supabase.from('memberships').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle();
  const ws = mem?.workspace_id as string | undefined;
  if (!ws) return NextResponse.json({ error: 'no_workspace' }, { status: 400 });

  const config = body.config ?? {};
  try {
    const points = await runConnector(provider, config, body.days ?? 30);
    // Upsert the connection with its config + connected status.
    const { data: existing } = await supabase.from('connections').select('id, config').eq('workspace_id', ws).eq('provider', provider).maybeSingle();
    if (existing) await supabase.from('connections').update({ status: 'connected', config: { ...(existing.config ?? {}), ...config } }).eq('id', existing.id);
    else await supabase.from('connections').insert({ workspace_id: ws, provider, status: 'connected', config });

    const synced = await upsertMetrics(supabase, ws, points);
    return NextResponse.json({ ok: true, synced });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
