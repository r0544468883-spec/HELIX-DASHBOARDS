import { NextResponse } from 'next/server';
import { createAdmin } from '@/lib/supabase/admin';
import { resolveTemplate } from '@/lib/resolve';
import { composeDigest } from '@/lib/digest';
import { workspaceDigest } from '@/lib/digest-data';
import { sendTelegram } from '@/lib/channels';

export const dynamic = 'force-dynamic';

// Telegram bot webhook. A linked chat (bot_links) gets its workspace's REAL data;
// an unlinked chat gets a demo of the requested dashboard. Keyword → dashboard.
const KEYWORDS: Record<string, string> = {
  שיווק: 'marketing', מכירות: 'sales', פיננסים: 'finance', כספים: 'finance',
  מוצר: 'product', חנות: 'ecommerce', שירות: 'support', 'כוח אדם': 'hr',
  מוניטין: 'reputation', הנהלה: 'executive', saas: 'saas',
};

export async function POST(req: Request) {
  const update = (await req.json().catch(() => ({}))) as { message?: { chat?: { id?: number }; text?: string } };
  const chatId = update.message?.chat?.id;
  const text = (update.message?.text ?? '').trim().toLowerCase();
  if (!chatId) return NextResponse.json({ ok: true });

  let key = 'executive';
  for (const [kw, tpl] of Object.entries(KEYWORDS)) if (text.includes(kw.toLowerCase())) { key = tpl; break; }

  const admin = createAdmin();
  const { data: link } = await admin.from('bot_links').select('workspace_id').eq('chat_id', String(chatId)).maybeSingle();

  let digest: string;
  if (link?.workspace_id) {
    digest = await workspaceDigest(admin, link.workspace_id as string, key);
  } else {
    const { name, widgets, dataById } = resolveTemplate(key);
    digest = await composeDigest(name, widgets, dataById);
  }
  await sendTelegram(String(chatId), digest);
  return NextResponse.json({ ok: true });
}
