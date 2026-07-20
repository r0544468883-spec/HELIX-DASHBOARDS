import type { WidgetDef, WidgetData, Series } from './types';
import { demoWidgetData } from './metrics';

type Row = { ts: string; value: number };
// Minimal structural type for the Supabase query we run. The builder is a
// PromiseLike (thenable), not a Promise — matching that avoids type friction.
type SupabaseLike = {
  from: (t: string) => {
    select: (c: string) => {
      eq: (k: string, v: string) => {
        eq: (k: string, v: string) => {
          order: (c: string, o: { ascending: boolean }) => PromiseLike<{ data: Row[] | null }>;
        };
      };
    };
  };
};

// Read metric_points for a widget and shape into WidgetData. Returns null when
// there's no data for this metric — the caller falls back to demo data.
export async function widgetDataFromDb(
  supabase: SupabaseLike,
  workspaceId: string,
  widget: Pick<WidgetDef, 'widget_type' | 'metric' | 'config'>
): Promise<WidgetData | null> {
  const { data } = await supabase
    .from('metric_points')
    .select('ts, value')
    .eq('workspace_id', workspaceId)
    .eq('metric', widget.metric)
    .order('ts', { ascending: true });

  if (!data || data.length === 0) return null;

  if (widget.widget_type === 'kpi' || widget.widget_type === 'gauge') {
    // Sum last 30 days vs previous 30 for the delta.
    const recent = data.slice(-30).reduce((s, r) => s + r.value, 0);
    const prior = data.slice(-60, -30).reduce((s, r) => s + r.value, 0);
    const delta = prior ? Math.round(((recent - prior) / prior) * 100) : 0;
    if (widget.widget_type === 'gauge') return { kind: 'gauge', value: recent, target: widget.config?.target ?? Math.round(recent * 1.2) };
    return { kind: 'kpi', value: recent, delta };
  }

  if (widget.widget_type === 'line' || widget.widget_type === 'bar') {
    const series: Series = data.slice(-30).map((r) => ({ label: r.ts.slice(5), value: r.value }));
    return { kind: 'series', series };
  }

  // table/funnel from raw points aren't meaningful yet — let caller use demo.
  return null;
}

// Resolve a widget's data: real from DB if present, else demo.
export async function resolveWidgetData(
  supabase: unknown | null,
  workspaceId: string | null,
  widget: WidgetDef
): Promise<WidgetData> {
  if (supabase && workspaceId) {
    const real = await widgetDataFromDb(supabase as SupabaseLike, workspaceId, widget);
    if (real) return real;
  }
  return demoWidgetData(widget);
}
