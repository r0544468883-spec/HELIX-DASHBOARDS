import type { WidgetDef, WidgetData } from './types';
import { formatValue } from './format';
import { narrate } from './ollama';
import { slippingKpis } from './autonomy/degradation';
import { narrativeIsClean } from './agents/dashboards/verify';

// Turn a dashboard's widgets+data into a short Hebrew digest. Ollama/Claude add
// a human narrative; if no model is configured we still return the raw KPI lines.
export async function composeDigest(dashboardName: string, widgets: WidgetDef[], dataById: Record<string, WidgetData>): Promise<string> {
  // Pull the headline KPIs (kpi widgets) into readable lines.
  const lines: string[] = [];
  for (const w of widgets) {
    const d = dataById[w.id];
    if (!d) continue;
    if (d.kind === 'kpi') {
      const delta = d.delta !== undefined ? ` (${d.delta >= 0 ? '+' : ''}${formatValue(d.delta, 'percent')})` : '';
      lines.push(`${w.title}: ${formatValue(d.value, w.config?.format)}${delta}`);
    } else if (d.kind === 'gauge') {
      lines.push(`${w.title}: ${Math.round((d.value / (d.target || 1)) * 100)}% מהיעד`);
    }
  }
  const facts = lines.join('\n');

  // Proactive layer (Von rule 3): flag KPIs that are slipping, so the digest
  // reports "X is going down" instead of only listing today's numbers.
  const slipping = slippingKpis(widgets, dataById);
  const slipFacts = slipping.map((s) => `⚠️ ${s.detail}`).join('\n');

  const narrative = await narrate([
    { role: 'system', content: 'אתה אנליסט עסקי שכותב בעברית טבעית, קצרה ואנושית. אל תמציא מספרים — השתמש רק בנתונים שקיבלת. 2-3 משפטים, טון ישראלי ענייני. הדגש חריגות והמלצה אחת.' },
    { role: 'user', content: `דשבורד "${dashboardName}". הנתונים:\n${facts}${slipFacts ? `\n\nמדדים שמידרדרים:\n${slipFacts}` : ''}\n\nכתוב סיכום יומי קצר.` },
  ]);

  const header = `📊 ${dashboardName} — סיכום יומי`;
  const body = slipFacts ? `${facts}\n\n${slipFacts}` : facts;

  // Critic gate (§4b): the narrator may have invented a figure. If any number in
  // the narrative isn't backed by the KPI facts, drop the narrative and ship the
  // raw verified numbers — a business digest must never report a made-up number.
  const clean = narrative ? narrativeIsClean(narrative, `${facts}\n${slipFacts}`) : { ok: false, strayNumbers: [] };
  return narrative && clean.ok ? `${header}\n\n${narrative}\n\n—\n${body}` : `${header}\n\n${body}`;
}
