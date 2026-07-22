import type { MetricPoint } from './types';

// HELIX OPS connector — pulls campaign A/B metrics (per campaign × channel:
// impressions/views/clicks/variants) from the HELIX OPS export endpoint into the
// dashboard's metric_points. This is how A/B-per-variant campaign data shows up on
// a dashboard. config: { base_url, api_key (export secret), ops_workspace_id }.
export async function fetchHelixOpsMetrics(baseUrl: string, secret: string, opsWorkspace: string): Promise<MetricPoint[]> {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/export/campaign-metrics?workspace=${encodeURIComponent(opsWorkspace)}`;
  const res = await fetch(url, { headers: { 'x-export-secret': secret }, cache: 'no-store' });
  if (!res.ok) throw new Error(`helixops_${res.status}`);
  const json = (await res.json()) as { points?: { metric: string; dims: Record<string, string>; value: number }[] };

  const ts = new Date().toISOString().slice(0, 10);
  return (json.points ?? []).map((p) => ({ source: 'helix_ops', metric: p.metric, dims: p.dims, ts, value: p.value }));
}
