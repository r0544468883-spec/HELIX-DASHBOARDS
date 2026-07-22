import type { MetricPoint } from './types';

// Rav-Messer / Responder (Israeli email+SMS marketing) — pulls list subscriber
// totals into metric_points. Keys from support@responder.co.il (03-717-7777).
// NOTE: Responder's public REST schema isn't fully documented — endpoint/field
// mapping below is best-effort and may need one tweak against the account's docs.
export async function fetchRavMesserMetrics(apiKey: string, apiSecret?: string): Promise<MetricPoint[]> {
  const base = 'https://api.responder.co.il';
  const headers: Record<string, string> = { authorization: apiKey, 'content-type': 'application/json' };
  if (apiSecret) headers['x-api-secret'] = apiSecret;

  const res = await fetch(`${base}/Api/Lists`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`ravmesser_${res.status}`);
  const json = (await res.json().catch(() => ({}))) as unknown;

  // Defensive parse: accept an array of lists or {lists:[...]}, each possibly
  // carrying a subscriber count under common field names.
  const lists: Record<string, unknown>[] = Array.isArray(json)
    ? (json as Record<string, unknown>[])
    : (((json as { lists?: unknown; data?: unknown }).lists ?? (json as { data?: unknown }).data ?? []) as Record<string, unknown>[]);

  const count = (l: Record<string, unknown>) =>
    Number(l.subscribers ?? l.subscribersCount ?? l.active_subscribers ?? l.count ?? 0) || 0;
  const subscribers = (lists ?? []).reduce((s, l) => s + count(l), 0);

  const ts = new Date().toISOString().slice(0, 10);
  return [{ source: 'ravmesser', metric: 'subscribers', dims: {}, ts, value: subscribers }];
}
