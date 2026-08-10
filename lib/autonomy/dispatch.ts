// Cross-product action dispatch (Phase 4). Dashboards is the context-graph hub:
// when a metric slips, it can kick the responsible product to act — over that
// product's OWN secret-gated trigger endpoint, which re-applies ITS own autonomy
// switch. So dispatch never bypasses a target's safety: it just asks.
//
// Env-driven and fail-safe: with no URL/secret configured it is a no-op (skipped),
// exactly like the read connectors. Nothing dispatches unless dash.cross_act is
// explicitly enabled AND the target product is wired.

export type CrossTarget = 'growth-doctor';

const REGISTRY: Record<CrossTarget, { url?: string; path: string }> = {
  'growth-doctor': { url: process.env.GROWTH_DOCTOR_URL, path: '/api/act/trigger' },
};

export interface CrossActPayload {
  workspaceId?: string | null; // target-product workspace id, if known (cross-product ids differ)
  reason: string;
}

export async function dispatchCrossAction(
  target: CrossTarget,
  payload: CrossActPayload,
): Promise<{ ok: boolean; skipped?: boolean; status?: number }> {
  const cfg = REGISTRY[target];
  const secret = process.env.CROSS_ACT_SECRET;
  if (!cfg?.url || !secret) return { ok: false, skipped: true };
  try {
    const res = await fetch(`${cfg.url}${cfg.path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cross-act-secret': secret },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false };
  }
}
