// WhatsApp Cloud API (Graph v21) — text + approved-template sends + template
// registration. Mirrors the SDR bot's lib/channels/whatsapp.ts, adapted to this
// repo's env-driven convention (WHATSAPP_TOKEN / WHATSAPP_PHONE_ID / WHATSAPP_WABA_ID).
// ⚠️ Proactive (business-initiated) messages outside the 24h window need an APPROVED
// template — see lib/whatsapp-catalog.ts + POST /api/templates/sync.

const GRAPH = 'https://graph.facebook.com/v21.0';

export type WaResult = { ok: boolean; externalId?: string; error?: string };

/** Free-text send (only valid inside the 24h customer-service window). */
export async function sendWhatsApp(to: string, content: string): Promise<WaResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return { ok: false, error: 'whatsapp_not_configured' };
  try {
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: content } }),
    });
    const json = (await res.json().catch(() => ({}))) as { messages?: { id?: string }[]; error?: { message?: string } };
    if (!res.ok) return { ok: false, error: json.error?.message ?? `whatsapp_${res.status}` };
    return { ok: true, externalId: json.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Send an APPROVED WhatsApp template — the compliant way to open a conversation
 * proactively (outside the 24h window). `params` fill the body {{1}},{{2}}… in order.
 * `urlButtonParam` fills a dynamic URL button suffix (e.g. the dashboard key to open).
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  language: string,
  params: string[],
  urlButtonParam?: string,
): Promise<WaResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return { ok: false, error: 'whatsapp_not_configured' };
  const components: Record<string, unknown>[] = [];
  if (params.length) {
    components.push({ type: 'body', parameters: params.map((t) => ({ type: 'text', text: t })) });
  }
  if (urlButtonParam) {
    components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: urlButtonParam }] });
  }
  try {
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: templateName, language: { code: language }, ...(components.length ? { components } : {}) },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { messages?: { id?: string }[]; error?: { message?: string } };
    if (!res.ok) return { ok: false, error: json.error?.message ?? `whatsapp_${res.status}` };
    return { ok: true, externalId: json.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Register (create) a message template on the WABA. Idempotent-ish: duplicate is treated as OK. */
export async function createWhatsAppTemplate(
  wabaId: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; id?: string; error?: string; status?: string }> {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) return { ok: false, error: 'whatsapp_not_configured' };
  try {
    const res = await fetch(`${GRAPH}/${wabaId}/message_templates`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; status?: string; error?: { message?: string; code?: number } };
    if (!res.ok) {
      // Duplicate template name → already exists → fine for our sync purpose.
      if (json.error?.message?.toLowerCase().includes('already exists')) return { ok: true, status: 'exists' };
      return { ok: false, error: json.error?.message ?? `waba_${res.status}` };
    }
    return { ok: true, id: json.id, status: json.status };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
