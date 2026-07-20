import { createClient } from '@/lib/supabase/server';
import { templateByKey } from './templates';
import { demoWidgetData } from './metrics';
import { resolveWidgetData } from './metrics-db';
import type { WidgetDef, WidgetData } from './types';

// Resolve a department dashboard for the current user:
//  - authed + a saved dashboard exists → load its dashboard_widgets (real ids)
//    and read data from metric_points (demo fallback per widget).
//  - otherwise → the canonical template with demo data (not persisted).
export async function resolveDashboard(key: string): Promise<{
  name: string;
  widgets: WidgetDef[];
  dataById: Record<string, WidgetData>;
  persisted: boolean;
}> {
  const tpl = templateByKey(key) ?? templateByKey('marketing')!;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  if (user) {
    const { data: mem } = await supabase.from('memberships').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle();
    const ws = mem?.workspace_id as string | undefined;
    if (ws) {
      const { data: dash } = await supabase
        .from('dashboards').select('id, name').eq('workspace_id', ws).eq('department', key).maybeSingle();
      if (dash) {
        const { data: rows } = await supabase
          .from('dashboard_widgets').select('id, widget_type, title, metric, config, layout').eq('dashboard_id', dash.id);
        const widgets: WidgetDef[] = (rows ?? []).map((r) => ({
          id: r.id, widget_type: r.widget_type, title: r.title, metric: r.metric,
          config: r.config ?? {}, layout: r.layout ?? { x: 0, y: 0, w: 3, h: 3 },
        }));
        const dataById: Record<string, WidgetData> = {};
        for (const w of widgets) dataById[w.id] = await resolveWidgetData(supabase, ws, w);
        return { name: dash.name, widgets, dataById, persisted: true };
      }
    }
  }

  // Fallback: canonical template + demo data.
  const widgets: WidgetDef[] = tpl.widgets.map((w, i) => ({ ...w, id: `${tpl.key}-${i}` }));
  const dataById: Record<string, WidgetData> = {};
  for (const w of widgets) dataById[w.id] = demoWidgetData(w);
  return { name: tpl.name, widgets, dataById, persisted: false };
}
