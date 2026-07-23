// POST /api/templates/sync?secret=... — registers every WhatsApp template (built-in
// catalog ∪ this workspace's custom uploads) on the WABA (Meta message_templates).
// Idempotent: templates that already exist are treated as OK. Run once after setting
// up the WABA, and again whenever the catalog or a custom template changes. Templates
// then need Meta APPROVAL (async).
// Auth: CRON_SECRET (?secret= or x-cron-secret). WABA id from WHATSAPP_WABA_ID.
// Body (optional): { workspace_id } — defaults to DEFAULT_WORKSPACE_ID.
import { NextResponse } from 'next/server';
import { createWhatsAppTemplate } from '@/lib/channels/whatsapp';
import { registrationPayloadsFor } from '@/lib/whatsapp-catalog';
import { mergedWhatsAppTemplates } from '@/lib/custom-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided = url.searchParams.get('secret') || req.headers.get('x-cron-secret');
  if (secret && provided !== secret) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const wabaId = process.env.WHATSAPP_WABA_ID;
  if (!wabaId) return NextResponse.json({ error: 'WHATSAPP_WABA_ID missing (needed to register templates)' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const workspaceId = body?.workspace_id || process.env.DEFAULT_WORKSPACE_ID;
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required (body or DEFAULT_WORKSPACE_ID)' }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  // Register built-in ∪ this workspace's custom WhatsApp templates.
  const merged = Object.values(await mergedWhatsAppTemplates(workspaceId));
  const results: { name: unknown; ok: boolean; status?: string; error?: string }[] = [];
  for (const payload of registrationPayloadsFor(merged, appUrl)) {
    const r = await createWhatsAppTemplate(wabaId, payload);
    results.push({ name: payload.name, ok: r.ok, status: r.status, error: r.error });
  }
  return NextResponse.json({ ok: true, registered: results.filter((r) => r.ok).length, total: results.length, results });
}
