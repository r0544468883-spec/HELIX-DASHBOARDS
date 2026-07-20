import { NextResponse } from 'next/server';
import { resolveTemplate } from '@/lib/resolve';
import { composeDigest } from '@/lib/digest';
import { sendTelegram } from '@/lib/channels';

export const dynamic = 'force-dynamic';

// Telegram bot webhook — the "access from the bot" channel. User texts the bot
// (e.g. "מה המצב?" / "שיווק") and gets the matching dashboard digest back.
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

  // Map the message to a dashboard; default to Executive Overview.
  let key = 'executive';
  for (const [kw, tpl] of Object.entries(KEYWORDS)) {
    if (text.includes(kw.toLowerCase())) { key = tpl; break; }
  }

  const { name, widgets, dataById } = resolveTemplate(key);
  const digest = await composeDigest(name, widgets, dataById);
  await sendTelegram(String(chatId), digest);
  return NextResponse.json({ ok: true });
}
