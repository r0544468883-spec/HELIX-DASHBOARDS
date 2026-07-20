import type { WidgetData, WidgetDef, Series } from './types';

// Deterministic pseudo-random from a string seed — stable across SSR/CSR so demo
// data doesn't cause hydration mismatch, and each metric looks distinct.
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const HE_MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ'];

// Demo data so a dashboard renders meaningfully BEFORE any connector is wired.
// Real data path: read metric_points from Supabase and shape into WidgetData.
export function demoWidgetData(w: Pick<WidgetDef, 'widget_type' | 'metric' | 'config'>): WidgetData {
  const rnd = seeded(w.metric);
  const base = 40 + Math.floor(rnd() * 900);

  if (w.widget_type === 'kpi') return { kind: 'kpi', value: base, delta: Math.round((rnd() - 0.4) * 40) };
  if (w.widget_type === 'gauge') return { kind: 'gauge', value: base, target: w.config?.target ?? Math.round(base * 1.3) };
  if (w.widget_type === 'funnel') {
    let v = base * 6;
    const labels = ['ביקורים', 'לידים', 'הזדמנויות', 'לקוחות'];
    return { kind: 'funnel', steps: labels.map((label) => { const s = { label, value: Math.round(v) }; v *= 0.45 + rnd() * 0.2; return s; }) };
  }
  if (w.widget_type === 'table') {
    return { kind: 'table', rows: Array.from({ length: 5 }, (_, i) => ({ '#': i + 1, פריט: `שורה ${i + 1}`, ערך: Math.floor(rnd() * 1000) })) };
  }
  // line / bar → 6-month series
  const series: Series = HE_MONTHS.map((label) => ({ label, value: Math.round(base * (0.6 + rnd() * 0.8)) }));
  return { kind: 'series', series };
}
