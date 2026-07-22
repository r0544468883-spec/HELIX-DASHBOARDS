import type { MetricPoint } from './types';

// ActiveTrail (Israeli email+SMS marketing) — pulls contact/subscriber totals into
// metric_points. API key from the ActiveTrail account (Settings → API). Auth is the
// key in the Authorization header. NOTE: field mapping is best-effort; verify
// against the account's API docs if numbers look off.
export async function fetchActiveTrailMetrics(apiKey: string): Promise<MetricPoint[]> {
  const base = 'https://api.activetrail.com';
  const headers = { authorization: apiKey, 'content-type': 'application/json' };

  // Contacts endpoint returns a paged list with a total count.
  const res = await fetch(`${base}/api/contacts?limit=1`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`activetrail_${res.status}`);
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  const subscribers = Number(
    json.total ?? json.total_count ?? json.totalResults ??
    (json as { paging?: { total?: number } }).paging?.total ?? 0
  ) || 0;

  const ts = new Date().toISOString().slice(0, 10);
  return [{ source: 'activetrail', metric: 'subscribers', dims: {}, ts, value: subscribers }];
}
