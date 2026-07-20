import type { WidgetDef, WidgetData } from './types';
import { templateByKey } from './templates';
import { demoWidgetData } from './metrics';

// Turn a department template into concrete WidgetDefs (with ids) + their data.
// For now data is demo; the real path swaps demoWidgetData for a metric_points read.
export function resolveTemplate(key: string): { name: string; widgets: WidgetDef[]; dataById: Record<string, WidgetData> } {
  const tpl = templateByKey(key) ?? templateByKey('marketing')!;
  const widgets: WidgetDef[] = tpl.widgets.map((w, i) => ({ ...w, id: `${tpl.key}-${i}` }));
  const dataById: Record<string, WidgetData> = {};
  for (const w of widgets) dataById[w.id] = demoWidgetData(w);
  return { name: tpl.name, widgets, dataById };
}
