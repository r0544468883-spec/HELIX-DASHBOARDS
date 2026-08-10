// HELIX Autonomy Switch — canonical types. Source: helix/PRODUCTS/autonomy-reference.
// Dashboards is the intended central context-graph hub (metric_points), so its
// switch governs cross-product action dispatch (dash.cross_act) in a later phase.

export type AutonomyMode = 'advisor' | 'approve' | 'autopilot';
export type RiskClass = 'internal' | 'outbound' | 'money' | 'tos';

export interface Degradation {
  entity: string;   // widget id / metric key
  metric: string;   // KPI title
  direction: 'down' | 'up';
  severity: 'info' | 'warn' | 'crit';
  detail?: string;
}

export const RISK_BY_FEATURE: Record<string, RiskClass> = {
  'dash.build_widget': 'internal',
  'dash.cross_act': 'internal', // delegates to the target product's own switch
};

export function riskOf(featureKey: string): RiskClass {
  return RISK_BY_FEATURE[featureKey] ?? 'outbound';
}

export function needsRiskAck(featureKey: string): boolean {
  return riskOf(featureKey) !== 'internal';
}
