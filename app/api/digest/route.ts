import { NextResponse } from 'next/server';
import { resolveTemplate } from '@/lib/resolve';
import { composeDigest } from '@/lib/digest';
import { workspaceDigestRich } from '@/lib/digest-data';
import { digestFigurePng } from '@/lib/digest-figure';
import { uploadDigestFigure } from '@/lib/digest-storage';
import { createClient } from '@/lib/supabase/server';
import { deliver, type Channel } from '@/lib/channels';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Compose a dashboard digest (Ollama/Claude narrative) and optionally deliver it.
// Uses the signed-in user's REAL workspace data when available; else a demo.
// Body: { template?, channel?, target? }.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { template?: string; channel?: Channel; target?: string };
  const department = body.template ?? 'marketing';

  let text: string;
  let figure: { png: Buffer; template: string } | null = null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const { data: mem } = user ? await supabase.from('memberships').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle() : { data: null };
  if (mem?.workspace_id) {
    ({ text, figure } = await workspaceDigestRich(supabase, mem.workspace_id as string, department));
  } else {
    const { name, widgets, dataById } = resolveTemplate(department);
    [text, figure] = await Promise.all([
      composeDigest(name, widgets, dataById),
      digestFigurePng(widgets, dataById).catch(() => null),
    ]);
  }

  const imageUrl = figure ? await uploadDigestFigure(figure.png, `digest-${department}`) ?? undefined : undefined;

  let delivered = false;
  if (body.channel && body.target) {
    delivered = await deliver(body.channel, body.target, 'HELIX — סיכום יומי', text, imageUrl);
  }
  return NextResponse.json({ text, delivered, imageUrl: imageUrl ?? null });
}
