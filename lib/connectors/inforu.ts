import type { MetricPoint } from './types';

// InforU (Israeli SMS+email marketing) — pulls contact-group subscriber totals into
// metric_points. Auth: account token/api key. NOTE: InforU's public REST schema
// isn't fully documented openly — endpoint/field mapping is best-effort and may
// need a tweak against the account's API docs.
export async function fetchInforuMetrics(apiKey: string): Promise<MetricPoint[]> {
  const base = 'https://uapi.inforu.co.il/api';
  const res = await fetch(`${base}/ContactGroup/Get`, {
    method: 'POST',
    headers: { authorization: `Basic ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({}),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`inforu_${res.status}`);
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  const groups: Record<string, unknown>[] =
    (((json.Data as { Groups?: unknown })?.Groups ?? json.Groups ?? json.data ?? []) as Record<string, unknown>[]) || [];
  const count = (g: Record<string, unknown>) => Number(g.ContactsCount ?? g.contactsCount ?? g.count ?? 0) || 0;
  const subscribers = groups.reduce((s, g) => s + count(g), 0);

  const ts = new Date().toISOString().slice(0, 10);
  return [{ source: 'inforu', metric: 'subscribers', dims: {}, ts, value: subscribers }];
}
