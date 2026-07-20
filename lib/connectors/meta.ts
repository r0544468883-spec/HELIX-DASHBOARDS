import type { MetricPoint } from './types';

// Meta Ads connector — daily spend/impressions/clicks from the Insights API.
// Needs a user/system access token + ad account id (act_XXXX).
export async function fetchMetaMetrics(accessToken: string, adAccountId: string, days = 30): Promise<MetricPoint[]> {
  const acct = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const url = new URL(`https://graph.facebook.com/v20.0/${acct}/insights`);
  url.searchParams.set('fields', 'spend,impressions,clicks');
  url.searchParams.set('time_increment', '1');
  url.searchParams.set('date_preset', days <= 7 ? 'last_7d' : days <= 30 ? 'last_30d' : 'last_90d');
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`meta_${res.status}`);
  const json = (await res.json()) as { data?: { date_start: string; spend?: string; impressions?: string; clicks?: string }[] };

  const points: MetricPoint[] = [];
  for (const r of json.data ?? []) {
    const ts = r.date_start;
    points.push({ source: 'meta_ads', metric: 'ad_spend', dims: {}, ts, value: parseFloat(r.spend ?? '0') || 0 });
    points.push({ source: 'meta_ads', metric: 'impressions', dims: {}, ts, value: parseFloat(r.impressions ?? '0') || 0 });
    points.push({ source: 'meta_ads', metric: 'clicks', dims: {}, ts, value: parseFloat(r.clicks ?? '0') || 0 });
  }
  return points;
}
