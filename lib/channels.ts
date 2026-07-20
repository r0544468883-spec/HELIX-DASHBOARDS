// Multi-channel delivery for digests — Telegram, WhatsApp (Cloud API), Email (Resend).
// Each adapter is env-driven and a no-op if not configured, so the digest never crashes.

export async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  return res.ok;
}

export async function sendWhatsApp(toPhone: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return false;
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: toPhone, type: 'text', text: { body: text } }),
  });
  return res.ok;
}

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'HELIX <hello@example.com>',
      to, subject,
      html: `<div dir="rtl" style="font-family:Arial;white-space:pre-wrap">${text}</div>`,
    }),
  });
  return res.ok;
}

export type Channel = 'telegram' | 'whatsapp' | 'email';

export async function deliver(channel: Channel, target: string, subject: string, text: string): Promise<boolean> {
  if (channel === 'telegram') return sendTelegram(target, text);
  if (channel === 'whatsapp') return sendWhatsApp(target, text);
  return sendEmail(target, subject, text);
}
