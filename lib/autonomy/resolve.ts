// HELIX Autonomy Switch — mode resolution (Dashboards). Fail-safe & downgrade-only.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AutonomyMode } from './types';
import { needsRiskAck } from './types';

export async function resolveMode(
  supabase: SupabaseClient,
  workspaceId: string,
  featureKey: string,
): Promise<AutonomyMode> {
  let row: { mode: AutonomyMode; risk_ack: boolean } | null = null;
  try {
    const { data } = await supabase
      .from('autonomy_settings')
      .select('mode, risk_ack')
      .eq('workspace_id', workspaceId)
      .eq('feature_key', featureKey)
      .maybeSingle();
    row = (data as { mode: AutonomyMode; risk_ack: boolean } | null) ?? null;
  } catch {
    return 'advisor';
  }
  if (!row) return 'advisor';
  if (row.mode === 'autopilot' && needsRiskAck(featureKey) && !row.risk_ack) {
    return 'approve';
  }
  return row.mode;
}
