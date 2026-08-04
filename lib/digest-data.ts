import type { WidgetDef, WidgetData } from './types';
import { templateByKey } from './templates';
import { demoWidgetData } from './metrics';
import { resolveWidgetData } from './metrics-db';
import { composeDigest } from './digest';
import { digestFigurePng } from './digest-figure';

type Client = {
  from: (t: string) => {
    select: (c: string) => {
      eq: (k: string, v: string) => {
        eq: (k: string, v: string) => { maybeSingle: () => PromiseLike<{ data: { id: string; name: string } | null }> };
        // list form (single .eq then rows)
      } & { then?: never };
    };
  };
};

// Compose a digest for a workspace's department dashboard using REAL data
// (metric_points), with demo fallback per widget. Works with server or admin
// client. Used by the bot and the scheduled digest cron.
export async function workspaceDigest(client: unknown, workspaceId: string, department: string): Promise<string> {
  const { name, widgets, dataById } = await loadDigestInputs(client, workspaceId, department);
  return composeDigest(name, widgets, dataById);
}

// Like workspaceDigest, but also renders ONE figure (PNG) from the same
// widgets+data so a delivery can carry a chart. figure is null when there isn't
// enough numeric data to draw an honest one. Figure rendering never throws the
// whole digest — a render failure just yields text only.
export type RichDigest = { text: string; figure: { png: Buffer; template: string } | null };
export async function workspaceDigestRich(client: unknown, workspaceId: string, department: string): Promise<RichDigest> {
  const { name, widgets, dataById } = await loadDigestInputs(client, workspaceId, department);
  const [text, figure] = await Promise.all([
    composeDigest(name, widgets, dataById),
    digestFigurePng(widgets, dataById).catch(() => null),
  ]);
  return { text, figure };
}

// Load a workspace department's widgets + resolved data (real data with a demo
// fallback per widget, or a full demo when no dashboard is saved).
async function loadDigestInputs(client: unknown, workspaceId: string, department: string): Promise<{ name: string; widgets: WidgetDef[]; dataById: Record<string, WidgetData> }> {
  const c = client as Client;
  const { data: dash } = await c.from('dashboards').select('id, name').eq('workspace_id', workspaceId).eq('department', department).maybeSingle();

  if (dash) {
    const rowsRes = await (client as unknown as {
      from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => PromiseLike<{ data: RawWidget[] | null }> } };
    }).from('dashboard_widgets').select('id, widget_type, title, metric, config, layout').eq('dashboard_id', dash.id);
    const widgets: WidgetDef[] = (rowsRes.data ?? []).map((r) => ({
      id: r.id, widget_type: r.widget_type, title: r.title, metric: r.metric,
      config: r.config ?? {}, layout: r.layout ?? { x: 0, y: 0, w: 3, h: 3 },
    }));
    const dataById: Record<string, WidgetData> = {};
    for (const w of widgets) dataById[w.id] = await resolveWidgetData(client, workspaceId, w);
    return { name: dash.name, widgets, dataById };
  }

  // No saved dashboard → template + demo.
  const tpl = templateByKey(department) ?? templateByKey('marketing')!;
  const widgets: WidgetDef[] = tpl.widgets.map((w, i) => ({ ...w, id: `${tpl.key}-${i}` }));
  const dataById: Record<string, WidgetData> = {};
  for (const w of widgets) dataById[w.id] = demoWidgetData(w);
  return { name: tpl.name, widgets, dataById };
}

type RawWidget = { id: string; widget_type: WidgetDef['widget_type']; title: string; metric: string; config: WidgetDef['config']; layout: WidgetDef['layout'] };
