// GA4 connector — pulls real metrics from the GA4 Data API and shapes them into
// metric_points rows (source='ga4'). Sync writes these to Supabase; widgets then
// read them via lib/metrics-db. First metrics: sessions + conversions by day.

import type { MetricPoint } from './types';

type Ga4Row = { dimensionValues: { value: string }[]; metricValues: { value: string }[] };

async function runReport(token: string, propertyId: string, body: unknown): Promise<Ga4Row[]> {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ga4_${res.status}`);
  const json = (await res.json()) as { rows?: Ga4Row[] };
  return json.rows ?? [];
}

// yyyymmdd (GA4 'date' dimension) → yyyy-mm-dd.
function ga4Date(d: string): string {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

export async function fetchGa4Metrics(token: string, propertyId: string, days = 30): Promise<MetricPoint[]> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const rows = await runReport(token, propertyId, {
    dateRanges: [{ startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'totalUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: 400,
  });

  const points: MetricPoint[] = [];
  for (const r of rows) {
    const ts = ga4Date(r.dimensionValues[0]?.value ?? '');
    if (!ts) continue;
    const [sessions, conversions, users] = r.metricValues.map((m) => parseFloat(m.value || '0') || 0);
    points.push({ source: 'ga4', metric: 'sessions', dims: {}, ts, value: sessions });
    points.push({ source: 'ga4', metric: 'conversions', dims: {}, ts, value: conversions });
    points.push({ source: 'ga4', metric: 'users', dims: {}, ts, value: users });
  }
  return points;
}
