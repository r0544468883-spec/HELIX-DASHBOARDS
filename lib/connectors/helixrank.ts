import type { MetricPoint } from './types';

// HELIX Rank connector — pulls SEO + GEO metrics (tracked keywords, avg position,
// top3/top10, improved/declined, opportunities, content pipeline, AI citation score
// + gaps) from the HELIX Rank export endpoint into the dashboard's metric_points.
// NOTE: Rank scopes by `site` (not workspace). config: { base_url, api_key (export
// secret), rank_site_id }.
export async function fetchHelixRankMetrics(baseUrl: string, secret: string, rankSite: string): Promise<MetricPoint[]> {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/export/rank-metrics?site=${encodeURIComponent(rankSite)}`;
  const res = await fetch(url, { headers: { 'x-export-secret': secret }, cache: 'no-store' });
  if (!res.ok) throw new Error(`helixrank_${res.status}`);
  const json = (await res.json()) as { points?: { metric: string; dims: Record<string, string>; value: number }[] };

  const ts = new Date().toISOString().slice(0, 10);
  return (json.points ?? []).map((p) => ({ source: 'helix_rank', metric: p.metric, dims: p.dims, ts, value: p.value }));
}
