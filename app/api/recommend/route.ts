import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VERTICALS, TEMPLATES } from '@/lib/templates';
import { narrate } from '@/lib/ollama';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// AI-Recommend (3-ways builder — mode 3). Given the business vertical + which data
// sources are actually connected, recommend the dashboards to set up and suggest a
// couple of extra widgets, with a Hebrew rationale. Deterministic base + model layer.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { vertical?: string };

  // Deterministic base: the vertical's bundle (or all departments if unknown).
  const v = VERTICALS.find((x) => x.key === body.vertical);
  const dashboards = v ? v.dashboards : TEMPLATES.map((t) => t.key);

  // Which sources are connected (if signed in) — sharpens the recommendation.
  let connected: string[] = [];
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: mem } = await supabase.from('memberships').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle();
      const ws = mem?.workspace_id as string | undefined;
      if (ws) {
        const { data: conns } = await supabase.from('connections').select('provider').eq('workspace_id', ws).eq('status', 'connected');
        connected = (conns ?? []).map((c) => c.provider as string);
      }
    }
  } catch { /* anonymous — recommend from vertical only */ }

  const rationale = await narrate([
    { role: 'system', content: 'אתה יועץ BI. תשובה קצרה בעברית טבעית (2-3 משפטים). המלץ על אילו דשבורדים להתמקד ואיזה מדד אחד חשוב במיוחד לעסק הזה. בלי רשימות ארוכות.' },
    { role: 'user', content: `סוג עסק: ${v?.name ?? 'כללי'}. מקורות מחוברים: ${connected.join(', ') || 'עדיין אין'}. דשבורדים מומלצים: ${dashboards.join(', ')}.` },
  ]);

  return NextResponse.json({
    vertical: v?.key ?? null,
    dashboards,
    connected,
    rationale: rationale || `מומלץ להתחיל מהדשבורדים: ${dashboards.map((d) => TEMPLATES.find((t) => t.key === d)?.name ?? d).join(' · ')}. חבר מקור נתונים אחד כדי לראות נתונים אמיתיים.`,
  });
}
