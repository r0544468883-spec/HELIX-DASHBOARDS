// Multi-channel delivery for digests — Telegram, WhatsApp (Cloud API), Email (Resend).
// Each adapter is env-driven and a no-op if not configured, so the digest never crashes.
//
// Every channel can now carry an optional figure image (a public PNG URL): the
// text is always the primary payload, and the chart is delivered as a photo
// (Telegram/WhatsApp) or inlined at the top of the email.

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

export async function sendTelegramPhoto(chatId: string, photoUrl: string, caption?: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // Telegram photo captions cap at ~1024 chars; keep it short (or omit).
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption?.slice(0, 1000), parse_mode: 'HTML' }),
  });
  return res.ok;
}

export async function sendWhatsApp(toPhone: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return false;
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: toPhone, type: 'text', text: { body: text } }),
  });
  return res.ok;
}

export async function sendWhatsAppImage(toPhone: string, imageUrl: string, caption?: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return false;
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: toPhone, type: 'image', image: { link: imageUrl, caption: caption?.slice(0, 1000) } }),
  });
  return res.ok;
}

export async function sendEmail(to: string, subject: string, text: string, imageUrl?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const img = imageUrl
    ? `<img src="${imageUrl}" alt="figure" style="display:block;max-width:100%;border-radius:12px;margin:0 0 16px" />`
    : '';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'HELIX <hello@example.com>',
      to, subject,
      html: `<div dir="rtl" style="font-family:Arial;white-space:pre-wrap">${img}${text}</div>`,
    }),
  });
  return res.ok;
}

export type Channel = 'telegram' | 'whatsapp' | 'email';

// Deliver the digest text, with an optional figure image. Text is always sent;
// the image is a best-effort follow-up (Telegram/WhatsApp) or inlined (email).
export async function deliver(channel: Channel, target: string, subject: string, text: string, imageUrl?: string): Promise<boolean> {
  if (channel === 'email') return sendEmail(target, subject, text, imageUrl);
  if (channel === 'telegram') {
    const ok = await sendTelegram(target, text);
    if (imageUrl) await sendTelegramPhoto(target, imageUrl);
    return ok;
  }
  const ok = await sendWhatsApp(target, text);
  if (imageUrl) await sendWhatsAppImage(target, imageUrl);
  return ok;
}
