import { NextResponse } from 'next/server';
import { resolveTemplate } from '@/lib/resolve';
import { composeDigest } from '@/lib/digest';
import { deliver, type Channel } from '@/lib/channels';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Compose a dashboard digest (Ollama/Claude narrative) and optionally deliver it
// to a channel. Body: { template?, channel?, target? }.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { template?: string; channel?: Channel; target?: string };
  const { name, widgets, dataById } = resolveTemplate(body.template ?? 'marketing');
  const text = await composeDigest(name, widgets, dataById);

  let delivered = false;
  if (body.channel && body.target) {
    delivered = await deliver(body.channel, body.target, `${name} — סיכום יומי`, text);
  }
  return NextResponse.json({ text, delivered });
}
