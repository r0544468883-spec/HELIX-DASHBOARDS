import type { MetricPoint } from './types';

// Shopify connector — daily sales + order count (and thus AOV) from the Admin API.
// Needs the shop domain (xxx.myshopify.com) + an Admin API access token.
export async function fetchShopifyMetrics(shop: string, accessToken: string, days = 30): Promise<MetricPoint[]> {
  const host = shop.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const url = `https://${host}/admin/api/2024-07/orders.json?status=any&limit=250&created_at_min=${encodeURIComponent(since)}&fields=created_at,total_price`;

  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': accessToken } });
  if (!res.ok) throw new Error(`shopify_${res.status}`);
  const json = (await res.json()) as { orders?: { created_at: string; total_price: string }[] };

  const sales = new Map<string, number>();
  const orders = new Map<string, number>();
  for (const o of json.orders ?? []) {
    const ts = o.created_at.slice(0, 10);
    sales.set(ts, (sales.get(ts) ?? 0) + (parseFloat(o.total_price) || 0));
    orders.set(ts, (orders.get(ts) ?? 0) + 1);
  }

  const points: MetricPoint[] = [];
  for (const [ts, value] of sales) points.push({ source: 'shopify', metric: 'sales', dims: {}, ts, value });
  for (const [ts, value] of orders) points.push({ source: 'shopify', metric: 'orders', dims: {}, ts, value });
  // AOV per day = sales/orders.
  for (const [ts, s] of sales) {
    const o = orders.get(ts) ?? 0;
    if (o > 0) points.push({ source: 'shopify', metric: 'aov', dims: {}, ts, value: Math.round(s / o) });
  }
  return points;
}
