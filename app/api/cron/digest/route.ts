import { NextResponse } from 'next/server';
import { createAdmin } from '@/lib/supabase/admin';
import { workspaceDigestRich, workspaceSlipping } from '@/lib/digest-data';
import { uploadDigestFigure } from '@/lib/digest-storage';
import { deliver, type Channel } from '@/lib/channels';
import { resolveMode } from '@/lib/autonomy/resolve';
import { dispatchCrossAction } from '@/lib/autonomy/dispatch';

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
  let dispatched = 0;
  for (const s of subs ?? []) {
    try {
      const { text, figure } = await workspaceDigestRich(admin, s.workspace_id as string, s.department as string);
      const imageUrl = figure ? await uploadDigestFigure(figure.png, `${s.workspace_id}-${s.department}`) ?? undefined : undefined;
      const ok = await deliver(s.channel as Channel, s.target as string, 'HELIX — סיכום יומי', text, imageUrl);
      if (ok) sent++;

      // Phase 4 — cross-product act: if KPIs are slipping and this workspace opted
      // dash.cross_act into approve/autopilot, kick the responsible product (Growth
      // Doctor) to diagnose+act. Default 'advisor' => no dispatch. The target
      // re-applies its OWN switch, so this can only ask — never force.
      const slip = await workspaceSlipping(admin, s.workspace_id as string, s.department as string);
      if (slip.length) {
        const mode = await resolveMode(admin, s.workspace_id as string, 'dash.cross_act');
        if (mode !== 'advisor') {
          const r = await dispatchCrossAction('growth-doctor', { reason: `Dashboards: ${slip.map((d) => d.metric).join(', ')} מידרדרים` });
          if (r.ok) dispatched++;
        }
      }
    } catch { /* one failing subscription must not abort the run */ }
  }
  return NextResponse.json({ ok: true, hour, matched: (subs ?? []).length, sent, dispatched });
}
