// Shared connector contract. Every connector fetches from a SaaS API and returns
// normalized metric_points rows (source-tagged), which sync routes upsert.
export type MetricPoint = {
  source: string;
  metric: string;
  dims: Record<string, string>;
  ts: string; // yyyy-mm-dd
  value: number;
};

// Config stored on connections.config, used by both interactive sync and cron.
// NOTE (MVP/security): tokens live here for cron to reuse. Production should move
// secrets to an encrypted vault / Supabase Vault rather than a members-readable column.
export type ConnectorConfig = Record<string, string | undefined>;
