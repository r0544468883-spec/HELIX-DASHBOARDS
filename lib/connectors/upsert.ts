import type { MetricPoint } from './types';

type UpsertClient = {
  from: (t: string) => { upsert: (rows: unknown[], opts: { onConflict: string }) => PromiseLike<{ error: { message: string } | null }> };
};

// Upsert metric_points for a workspace, chunked, on the natural unique key so
// re-syncs update in place. Works with both the server (RLS) and admin clients.
export async function upsertMetrics(supabase: unknown, workspaceId: string, points: MetricPoint[]): Promise<number> {
  const client = supabase as UpsertClient;
  const rows = points.map((p) => ({ workspace_id: workspaceId, source: p.source, metric: p.metric, dims: p.dims, ts: p.ts, value: p.value }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await client.from('metric_points').upsert(rows.slice(i, i + 500), { onConflict: 'workspace_id,source,metric,dims,ts' });
    if (error) throw new Error(error.message);
  }
  return rows.length;
}
