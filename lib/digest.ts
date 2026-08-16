import type { WidgetDef, WidgetData } from './types';
import { formatValue } from './format';
import { slippingKpis } from './autonomy/degradation';
import { composeNarrative } from './agents/dashboards/department-chief';

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

  const header = `📊 ${dashboardName} — סיכום יומי`;
  const body = slipFacts ? `${facts}\n\n${slipFacts}` : facts;

  // Department Chief (§4b) runs the full team: Researcher (the KPI facts above) →
  // Maker → Critic → Editor → Recommender, and returns only verified output.
  const { narrative, recommendation } = await composeNarrative(dashboardName, facts, slipFacts);
  const recLine = recommendation ? `\n\n👉 המלצה: ${recommendation}` : '';

  const top = narrative ? `${header}\n\n${narrative}` : header;
  return `${top}${recLine}\n\n—\n${body}`;
}
