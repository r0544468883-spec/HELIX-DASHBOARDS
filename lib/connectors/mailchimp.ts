import type { MetricPoint } from './types';

// Mailchimp connector — email list health (subscribers, unsubscribes) aggregated
// across lists. The data center is encoded in the API key suffix (…-usXX).
// Harvested & adapted (MIT) from builderz-labs/marketing-dashboard.
export async function fetchMailchimpMetrics(apiKey: string): Promise<MetricPoint[]> {
  const dc = apiKey.split('-')[1];
  if (!dc) throw new Error('mailchimp_invalid_key');

  const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists?count=50`, {
    headers: { authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`mailchimp_${res.status}`);
  const json = (await res.json()) as { lists?: { stats?: { member_count?: number; unsubscribe_count?: number } }[] };

  const totals = (json.lists ?? []).reduce(
    (a, l) => ({ members: a.members + (l.stats?.member_count ?? 0), unsub: a.unsub + (l.stats?.unsubscribe_count ?? 0) }),
    { members: 0, unsub: 0 }
  );
  const ts = new Date().toISOString().slice(0, 10);
  return [
    { source: 'mailchimp', metric: 'subscribers', dims: {}, ts, value: totals.members },
    { source: 'mailchimp', metric: 'unsubscribes', dims: {}, ts, value: totals.unsub },
  ];
}
