import type { MetricPoint } from './types';

// HELIX Growth Doctor connector — pulls CRO/retention metrics (conversion rate,
// overall + top drop-off, entered/converted) from the Growth Doctor export endpoint
// into the dashboard's metric_points. config: { base_url, api_key (export secret),
// gd_workspace_id }.
export async function fetchHelixGrowthMetrics(baseUrl: string, secret: string, gdWorkspace: string): Promise<MetricPoint[]> {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/export/growth-metrics?workspace=${encodeURIComponent(gdWorkspace)}`;
  const res = await fetch(url, { headers: { 'x-export-secret': secret }, cache: 'no-store' });
  if (!res.ok) throw new Error(`helixgrowth_${res.status}`);
  const json = (await res.json()) as { points?: { metric: string; dims: Record<string, string>; value: number }[] };

  const ts = new Date().toISOString().slice(0, 10);
  return (json.points ?? []).map((p) => ({ source: 'helix_growth', metric: p.metric, dims: p.dims, ts, value: p.value }));
}
