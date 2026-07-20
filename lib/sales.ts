import type { MetricPoint } from './connectors/types';

// Native sales pipeline metrics (atomic-crm pattern) — computed from the deals
// table into metric_points so the Sales dashboard shows REAL numbers with no
// external CRM required. Stage → close-probability weights the forecast.
const STAGE_PROB: Record<string, number> = { new: 0.1, qualified: 0.3, proposal: 0.6, won: 1, lost: 0 };
const OPEN = ['new', 'qualified', 'proposal'];

type Deal = { value: number | string; stage: string };
type Client = { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => PromiseLike<{ data: Deal[] | null }> } } };

export async function computeSalesMetrics(client: unknown, workspaceId: string): Promise<MetricPoint[]> {
  const { data } = await (client as Client).from('deals').select('value, stage').eq('workspace_id', workspaceId);
  const deals = data ?? [];
  const num = (v: number | string) => Number(v) || 0;

  const open = deals.filter((d) => OPEN.includes(d.stage));
  const won = deals.filter((d) => d.stage === 'won');
  const lost = deals.filter((d) => d.stage === 'lost');

  const pipeline = open.reduce((s, d) => s + num(d.value), 0);
  const winRate = won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
  const forecast = open.reduce((s, d) => s + num(d.value) * (STAGE_PROB[d.stage] ?? 0), 0);

  const ts = new Date().toISOString().slice(0, 10);
  return [
    { source: 'deals', metric: 'pipeline_value', dims: {}, ts, value: Math.round(pipeline) },
    { source: 'deals', metric: 'win_rate', dims: {}, ts, value: winRate },
    { source: 'deals', metric: 'forecast', dims: {}, ts, value: Math.round(forecast) },
  ];
}
