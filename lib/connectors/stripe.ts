import type { MetricPoint } from './types';

// Stripe connector — daily revenue from succeeded charges + current MRR from
// active subscriptions. Needs a Stripe secret key (sk_...). Amounts are minor
// units (agorot/cents) → divided by 100.
async function stripeGet(path: string, key: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, { headers: { authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`stripe_${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function fetchStripeMetrics(secretKey: string, days = 30): Promise<MetricPoint[]> {
  const since = Math.floor((Date.now() - days * 86400000) / 1000);
  const points: MetricPoint[] = [];

  // Revenue by day from succeeded charges.
  const charges = (await stripeGet(`charges?limit=100&created[gte]=${since}`, secretKey)) as { data?: { amount: number; paid: boolean; created: number; currency: string }[] };
  const byDay = new Map<string, number>();
  for (const c of charges.data ?? []) {
    if (!c.paid) continue;
    const ts = new Date(c.created * 1000).toISOString().slice(0, 10);
    byDay.set(ts, (byDay.get(ts) ?? 0) + c.amount / 100);
  }
  for (const [ts, value] of byDay) points.push({ source: 'stripe', metric: 'revenue', dims: {}, ts, value });

  // Current MRR estimate from active subscriptions (sum of item amounts, normalized to monthly).
  const subs = (await stripeGet('subscriptions?status=active&limit=100&expand[]=data.items', secretKey)) as {
    data?: { items?: { data?: { price?: { unit_amount?: number; recurring?: { interval?: string } } }[] } }[];
  };
  let mrr = 0;
  for (const s of subs.data ?? []) {
    for (const it of s.items?.data ?? []) {
      const amt = (it.price?.unit_amount ?? 0) / 100;
      const interval = it.price?.recurring?.interval;
      mrr += interval === 'year' ? amt / 12 : interval === 'week' ? amt * 4.33 : amt;
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  points.push({ source: 'stripe', metric: 'mrr', dims: {}, ts: today, value: Math.round(mrr) });
  return points;
}
