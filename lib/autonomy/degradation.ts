// Dashboards degradation detector (Von rule 3): surface KPIs that are slipping.
// Pure + deterministic — the LLM narrates, it does not decide what's slipping.

import type { WidgetDef, WidgetData } from '../types';
import type { Degradation } from './types';

// A KPI is "slipping" when its period-over-period delta is a drop beyond
// SLIP_THRESHOLD (a fraction, e.g. -0.10 = down 10%+). delta is stored as a
// fraction on kpi widget data (see metrics-db resolveWidgetData).
export const SLIP_THRESHOLD = -0.1;

export function slippingKpis(
  widgets: WidgetDef[],
  dataById: Record<string, WidgetData>,
  threshold: number = SLIP_THRESHOLD,
): Degradation[] {
  const out: Degradation[] = [];
  for (const w of widgets) {
    const d = dataById[w.id];
    if (!d || d.kind !== 'kpi' || d.delta === undefined) continue;
    if (d.delta <= threshold) {
      out.push({
        entity: w.id,
        metric: w.title,
        direction: 'down',
        severity: d.delta <= threshold * 2 ? 'crit' : 'warn',
        detail: `${w.title} ירד ${Math.round(Math.abs(d.delta) * 100)}% מול התקופה הקודמת`,
      });
    }
  }
  return out;
}
