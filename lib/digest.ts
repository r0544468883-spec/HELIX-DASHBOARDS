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
  const allFacts = `${facts}\n${slipFacts}`;

  // Department (§4b): Researcher = the KPI facts above; Maker = narrate; Critic =
  // narrativeIsClean; Editor = one revise pass. If the narrative states a number
  // not backed by the data, the Editor re-narrates using ONLY the facts; if it's
  // still unclean, we drop it and ship the raw verified numbers (a business digest
  // must never report a made-up figure).
  let finalNarrative = narrative;
  if (finalNarrative && !narrativeIsClean(finalNarrative, allFacts).ok) {
    const revised = await narrate([
      { role: 'system', content: 'אתה עורך. שכתב את הסיכום כך שישתמש אך ורק במספרים שמופיעים בעובדות שסופקו. אל תמציא אף מספר. 2-3 משפטים, עברית טבעית.' },
      { role: 'user', content: `עובדות (המקור היחיד למספרים):\n${allFacts}\n\nסיכום לתקן:\n${finalNarrative}` },
    ]);
    finalNarrative = revised && narrativeIsClean(revised, allFacts).ok ? revised : '';
  }
  return finalNarrative ? `${header}\n\n${finalNarrative}\n\n—\n${body}` : `${header}\n\n${body}`;
}
