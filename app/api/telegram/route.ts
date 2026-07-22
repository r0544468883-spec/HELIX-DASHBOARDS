import { NextResponse } from 'next/server';
import { createAdmin } from '@/lib/supabase/admin';
import { resolveTemplate } from '@/lib/resolve';
import { composeDigest } from '@/lib/digest';
import { sendTelegram } from '@/lib/channels';
import { handleOperatorCommand, DEPT_KEYWORDS } from '@/lib/bot/operator';

export const dynamic = 'force-dynamic';

// Telegram bot webhook. A linked chat (bot_links) routes to the operator command
// router and gets its workspace's REAL data (list dashboards, numbers, digests,
// metric lookups). An unlinked chat gets a demo digest of the requested dashboard.
export async function POST(req: Request) {
  const update = (await req.json().catch(() => ({}))) as { message?: { chat?: { id?: number }; text?: string } };
  const chatId = update.message?.chat?.id;
  const text = (update.message?.text ?? '').trim();
  if (!chatId) return NextResponse.json({ ok: true });

  const admin = createAdmin();
  const { data: link } = await admin.from('bot_links').select('workspace_id').eq('chat_id', String(chatId)).maybeSingle();

  let reply: string;
  if (link?.workspace_id) {
    // Linked operator → full command router over real workspace data.
    reply = await handleOperatorCommand(admin, link.workspace_id as string, text);
  } else {
    // Unlinked → demo digest of the keyword-matched dashboard.
    const lower = text.toLowerCase();
    let key = 'executive';
    for (const [kw, tpl] of Object.entries(DEPT_KEYWORDS)) if (lower.includes(kw.toLowerCase())) { key = tpl; break; }
    const { name, widgets, dataById } = resolveTemplate(key);
    reply = await composeDigest(name, widgets, dataById);
  }
  await sendTelegram(String(chatId), reply);
  return NextResponse.json({ ok: true });
}
