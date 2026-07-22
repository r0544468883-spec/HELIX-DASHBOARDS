import type { MetricPoint } from './types';

// HELIX SDR connector — pulls SDR + lifecycle metrics (contacts, lifecycle
// customers, appointment confirm/cancel/pending + confirm-rate, reminder
// sent/failed/due counts) from the HELIX SDR-BDR bot's export endpoint into the
// dashboard's metric_points. This is how the SDR product's numbers show up on a
// dashboard. Mirrors the helix_ops connector — the SDR export returns { points }
// in the exact same shape. config: { base_url, api_key (export secret), sdr_workspace_id }.
export async function fetchHelixSdrMetrics(baseUrl: string, secret: string, sdrWorkspace: string): Promise<MetricPoint[]> {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/export/sdr-metrics?workspace=${encodeURIComponent(sdrWorkspace)}`;
  const res = await fetch(url, { headers: { 'x-export-secret': secret }, cache: 'no-store' });
  if (!res.ok) throw new Error(`helix_sdr_${res.status}`);
  const json = (await res.json()) as { points?: { metric: string; dims: Record<string, string>; value: number }[] };

  const ts = new Date().toISOString().slice(0, 10);
  return (json.points ?? []).map((p) => ({ source: 'helix_sdr', metric: p.metric, dims: p.dims, ts, value: p.value }));
}
