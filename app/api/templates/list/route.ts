// GET /api/templates/list?workspace= — merged WhatsApp catalog for the management
// UI: built-in ∪ custom. Each item is tagged source: 'builtin' | 'custom' and
// overrides: true when a custom entry shadows a built-in key.
import { NextRequest, NextResponse } from 'next/server';
import { TEMPLATES } from '@/lib/whatsapp-catalog';
import { mergedWhatsAppTemplates, listCustom } from '@/lib/custom-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get('workspace') || process.env.DEFAULT_WORKSPACE_ID;
  if (!workspaceId) return NextResponse.json({ error: 'workspace required' }, { status: 400 });

  const builtinWa = new Set(Object.keys(TEMPLATES));

  const [waMerged, waCustomRows] = await Promise.all([
    mergedWhatsAppTemplates(workspaceId),
    listCustom(workspaceId, 'whatsapp'),
  ]);
  const waCustomKeys = new Set(waCustomRows.map((r) => (r as { key: string }).key));

  const whatsapp = Object.entries(waMerged).map(([key, d]) => {
    // TemplateDef has no quickReply, but custom JSON defs may carry one.
    const extra = d as typeof d & { quickReply?: string[] | null };
    return {
      key, name: d.name, language: d.language, category: d.category, body: d.body,
      params: d.params, sampleParams: d.sampleParams,
      urlButton: d.urlButton ?? null, quickReply: extra.quickReply ?? null,
      source: waCustomKeys.has(key) ? 'custom' : 'builtin',
      overrides: waCustomKeys.has(key) && builtinWa.has(key),
    };
  });

  return NextResponse.json({ whatsapp });
}
