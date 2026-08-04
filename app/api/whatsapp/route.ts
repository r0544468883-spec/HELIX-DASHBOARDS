import { NextResponse } from 'next/server';
import { createAdmin } from '@/lib/supabase/admin';
import { resolveTemplate } from '@/lib/resolve';
import { composeDigest } from '@/lib/digest';
import { digestFigurePng } from '@/lib/digest-figure';
import { uploadDigestFigure } from '@/lib/digest-storage';
import { sendWhatsApp, sendWhatsAppImage } from '@/lib/channels';
import { handleOperatorCommand, DEPT_KEYWORDS } from '@/lib/bot/operator';

export const dynamic = 'force-dynamic';

// WhatsApp Cloud API webhook — the mirror of the Telegram bot. Meta verifies the
// endpoint with a GET challenge, then POSTs inbound messages. A linked number
// (bot_links.chat_id = phone) gets its workspace's REAL data via the operator
// router; an unlinked number gets a demo digest. Digest replies also carry a
// rendered chart image. Replies use free-text (valid inside the 24h window that
// the user's inbound message opens).

// Meta webhook verification handshake.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 });
  }
  return new Response('forbidden', { status: 403 });
}

type WaWebhook = {
  entry?: { changes?: { value?: { messages?: { from?: string; type?: string; text?: { body?: string } }[] } }[] }[];
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as WaWebhook;
  const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const from = msg?.from;
  const text = (msg?.text?.body ?? '').trim();
  // Non-message events (status callbacks etc.) — ack and ignore.
  if (!from || msg?.type !== 'text') return NextResponse.json({ ok: true });

  const admin = createAdmin();
  const { data: link } = await admin.from('bot_links').select('workspace_id').eq('chat_id', from).maybeSingle();

  let reply: string;
  let figure: { png: Buffer; template: string } | null = null;
  if (link?.workspace_id) {
    ({ text: reply, figure = null } = await handleOperatorCommand(admin, link.workspace_id as string, text));
  } else {
    const lower = text.toLowerCase();
    let key = 'executive';
    for (const [kw, tpl] of Object.entries(DEPT_KEYWORDS)) if (lower.includes(kw.toLowerCase())) { key = tpl; break; }
    const { name, widgets, dataById } = resolveTemplate(key);
    [reply, figure] = await Promise.all([
      composeDigest(name, widgets, dataById),
      digestFigurePng(widgets, dataById).catch(() => null),
    ]);
  }

  await sendWhatsApp(from, reply);
  if (figure) {
    const url = await uploadDigestFigure(figure.png, `wa-${from}`);
    if (url) await sendWhatsAppImage(from, url);
  }
  return NextResponse.json({ ok: true });
}
