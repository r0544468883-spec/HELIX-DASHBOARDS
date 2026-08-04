// Operator bot commands — the workspace OWNER talks to the bot (Telegram/WhatsApp)
// to drive HELIX DASHBOARDS in natural Hebrew. A linked chat (bot_links) routes
// HERE and gets its workspace's REAL data. Every dashboards feature is reachable:
// list dashboards, get a dashboard's numbers, trigger a digest, query one metric.
import { workspaceDigestRich } from '@/lib/digest-data';
import { formatValue } from '@/lib/format';

// An operator reply is text, optionally with ONE rendered figure (digest replies
// carry a chart; list/metric/help replies are text-only). Both bots (Telegram,
// WhatsApp) send the text and, when present, the figure as a photo.
export type OperatorReply = { text: string; figure?: { png: Buffer; template: string } | null };

// Hebrew keyword → department key (a dashboard). Shared with the digest keyword flow.
export const DEPT_KEYWORDS: Record<string, string> = {
  שיווק: 'marketing', מכירות: 'sales', פיננסים: 'finance', כספים: 'finance',
  מוצר: 'product', חנות: 'ecommerce', שירות: 'support', 'כוח אדם': 'hr',
  מוניטין: 'reputation', הנהלה: 'executive', סטארטאפ: 'startup',
  קמפיינים: 'campaigns', saas: 'saas',
};

const HELP = [
  'שלום 👋 אני עוזר ה-HELIX DASHBOARDS. אפשר לבקש ממני בשפה חופשית, למשל:',
  '• "דוח מכירות" / "סיכום שיווק" — סיכום יומי חכם של דשבורד',
  '• "מדדים חנות" / "דשבורד פיננסים" — המספרים המרכזיים של דשבורד',
  '• "רשימת דשבורדים" — כל הדשבורדים שמוגדרים לך',
  '• "מדד mrr" / "כמה revenue" — הערך הנוכחי של מדד ספציפי',
  '• "עזרה" — התפריט הזה',
].join('\n');

// Loose chainable shape for the Supabase query builder — every step returns a
// thenable that also exposes the next chain methods, matching how we use it.
type Chain = {
  select: (c: string) => Chain;
  eq: (k: string, v: string) => Chain;
  order: (c: string, o: { ascending: boolean }) => Chain;
} & PromiseLike<{ data: unknown }>;
type MinimalClient = { from: (t: string) => Chain };

/** Detect which department dashboard the text refers to (default executive). */
function detectDept(text: string): string {
  const t = text.toLowerCase();
  for (const [kw, dep] of Object.entries(DEPT_KEYWORDS)) if (t.includes(kw.toLowerCase())) return dep;
  return 'executive';
}

/** List the dashboards defined for this workspace (falls back to available templates). */
async function listDashboards(client: unknown, workspaceId: string): Promise<string> {
  const c = client as MinimalClient;
  const { data } = await (c.from('dashboards').select('name, department').eq('workspace_id', workspaceId) as unknown as PromiseLike<{ data: { name: string; department: string }[] | null }>);
  const rows = data ?? [];
  if (!rows.length) return 'עדיין לא הוגדרו דשבורדים בחשבון. אפשר לבקש "דוח הנהלה" לקבל סיכום לדוגמה, או להגדיר דשבורד באפליקציה.';
  const lines = rows.map((r) => `• ${r.name} (${r.department})`);
  return ['🗂️ הדשבורדים שלך:', ...lines, '', 'בקש/י "דוח <שם>" לסיכום או "מדדים <שם>" למספרים.'].join('\n');
}

/** Return the latest value of a specific metric (substring match on metric key). */
async function metricLookup(client: unknown, workspaceId: string, query: string): Promise<string> {
  const c = client as MinimalClient;
  const { data } = await (c.from('metric_points').select('metric, value, ts').eq('workspace_id', workspaceId).order('ts', { ascending: false }) as unknown as PromiseLike<{ data: { metric: string; value: number; ts: string }[] | null }>);
  const rows = data ?? [];
  if (!rows.length) return 'אין עדיין נתונים במערכת. חבר/י מקור נתונים במסך החיבורים.';
  const needle = query.replace(/[^a-z0-9_֐-׿ ]/gi, '').trim().toLowerCase();
  const metrics = Array.from(new Set(rows.map((r) => r.metric)));
  const hit = metrics.find((m) => m.toLowerCase().includes(needle)) ?? (needle ? undefined : metrics[0]);
  if (!hit) {
    return `לא מצאתי מדד בשם "${query}". מדדים זמינים: ${metrics.slice(0, 15).join(', ')}`;
  }
  const latest = rows.find((r) => r.metric === hit)!;
  return `📈 ${hit}: ${formatValue(latest.value)} (נכון ל-${latest.ts})`;
}

/**
 * Route an operator message to the right dashboards action and return a Hebrew reply.
 * `client` is a service-role/admin Supabase client (bypasses RLS for the workspace).
 */
export async function handleOperatorCommand(client: unknown, workspaceId: string, text: string): Promise<OperatorReply> {
  const t = (text ?? '').trim();
  if (!t || /^(עזרה|help|\?|תפריט)/i.test(t)) return { text: HELP };

  // List dashboards.
  if (/(רשימ|רשימת).*(דשבורד|דוח)|^דשבורדים|list.*dash/i.test(t)) {
    return { text: await listDashboards(client, workspaceId) };
  }

  // Specific metric lookup: "מדד <x>" / "כמה <x>" / "metric <x>".
  const metricMatch = t.match(/^(?:מדד|כמה|metric)\s+(.+)/i);
  if (metricMatch) {
    return { text: await metricLookup(client, workspaceId, metricMatch[1]) };
  }

  // Numbers of a dashboard ("מדדים <dept>") → digest of that dashboard.
  // Trigger a digest / summary ("דוח" / "סיכום" / "דשבורד <dept>") — these carry a figure.
  if (/^(דוח|סיכום|מדדים|דשבורד|report|digest|summary)/i.test(t)) {
    const dept = detectDept(t);
    try {
      return await workspaceDigestRich(client, workspaceId, dept);
    } catch (e) {
      return { text: `שגיאה בהפקת הדוח: ${e instanceof Error ? e.message : 'לא ידועה'}` };
    }
  }

  // Bare department keyword ("מכירות") → its digest (with figure).
  const dept = detectDept(t);
  if (dept !== 'executive' || /הנהלה|executive/i.test(t)) {
    try {
      return await workspaceDigestRich(client, workspaceId, dept);
    } catch {
      return { text: HELP };
    }
  }

  return { text: HELP };
}
