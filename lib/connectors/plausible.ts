import type { MetricPoint } from './types';

// Plausible connector — privacy-first web analytics. Daily visitors + pageviews.
// Needs site_id + API key (+ optional self-hosted base URL). Harvested & adapted
// (MIT) from builderz-labs/marketing-dashboard.
export async function fetchPlausibleMetrics(siteId: string, apiKey: string, baseUrl = 'https://plausible.io', days = 30): Promise<MetricPoint[]> {
  const base = baseUrl.replace(/\/+$/, '');
  const params = new URLSearchParams({ site_id: siteId, period: `${days}d`, metrics: 'visitors,pageviews' });
  const res = await fetch(`${base}/api/v1/stats/timeseries?${params.toString()}`, {
    headers: { authorization: `Bearer ${apiKey}` }, cache: 'no-store',
  });
  if (!res.ok) throw new Error(`plausible_${res.status}`);
  const json = (await res.json()) as { results?: { date: string; visitors?: number; pageviews?: number }[] };

  const points: MetricPoint[] = [];
  for (const r of json.results ?? []) {
    if (!r.date) continue;
    points.push({ source: 'plausible', metric: 'visitors', dims: {}, ts: r.date, value: r.visitors ?? 0 });
    points.push({ source: 'plausible', metric: 'pageviews', dims: {}, ts: r.date, value: r.pageviews ?? 0 });
  }
  return points;
}
