import type { DepartmentTemplate, Vertical } from './types';

// Canonical widget sets per department (spec §0.1). Each template is the "right"
// default KPIs for that domain — grounded in standard frameworks (AARRR, SaaS
// metrics, sales pipeline). Layout is a 12-col grid.
const kpi = (x: number, metric: string, title: string, format: 'number' | 'currency' | 'percent' = 'number') =>
  ({ widget_type: 'kpi' as const, title, metric, config: { format }, layout: { x, y: 0, w: 3, h: 3 } });

export const TEMPLATES: DepartmentTemplate[] = [
  {
    key: 'marketing', department: 'marketing', name: 'שיווק',
    widgets: [
      kpi(9, 'roas', 'ROAS', 'number'),
      kpi(6, 'cpl', 'עלות לליד (CPL)', 'currency'),
      kpi(3, 'conversion_rate', 'אחוז המרה', 'percent'),
      kpi(0, 'ltv_cac', 'LTV:CAC', 'number'),
      { widget_type: 'line', title: 'תנועה לאורך זמן', metric: 'sessions', config: { format: 'number' }, layout: { x: 0, y: 3, w: 8, h: 5 } },
      { widget_type: 'bar', title: 'ביצועים לפי ערוץ', metric: 'channel_perf', config: { format: 'number' }, layout: { x: 8, y: 3, w: 4, h: 5 } },
    ],
  },
  {
    key: 'sales', department: 'sales', name: 'מכירות (Pipeline)',
    widgets: [
      kpi(9, 'pipeline_value', 'שווי צנרת', 'currency'),
      kpi(6, 'win_rate', 'אחוז סגירה', 'percent'),
      kpi(3, 'cycle_length', 'אורך מחזור (ימים)', 'number'),
      kpi(0, 'forecast', 'תחזית רבעון', 'currency'),
      { widget_type: 'funnel', title: 'משפך מכירות', metric: 'sales_funnel', layout: { x: 0, y: 3, w: 6, h: 5 } },
      { widget_type: 'table', title: 'Leaderboard נציגים', metric: 'rep_leaderboard', layout: { x: 6, y: 3, w: 6, h: 5 } },
    ],
  },
  {
    key: 'finance', department: 'finance', name: 'פיננסים',
    widgets: [
      kpi(9, 'cash_balance', 'יתרת מזומן', 'currency'),
      kpi(6, 'revenue', 'הכנסות', 'currency'),
      kpi(3, 'vat_due', 'מע״מ לתשלום', 'currency'),
      kpi(0, 'runway_months', 'Runway (חודשים)', 'number'),
      { widget_type: 'line', title: 'תזרים מזומנים', metric: 'cash_flow', config: { format: 'currency' }, layout: { x: 0, y: 3, w: 8, h: 5 } },
      { widget_type: 'table', title: 'חשבוניות באיחור (AR aging)', metric: 'ar_aging', layout: { x: 8, y: 3, w: 4, h: 5 } },
    ],
  },
  {
    key: 'saas', department: 'saas', name: 'SaaS Metrics',
    widgets: [
      kpi(9, 'mrr', 'MRR', 'currency'),
      kpi(6, 'arr', 'ARR', 'currency'),
      kpi(3, 'churn', 'Churn', 'percent'),
      kpi(0, 'nrr', 'NRR', 'percent'),
      { widget_type: 'line', title: 'MRR לאורך זמן', metric: 'mrr_trend', config: { format: 'currency' }, layout: { x: 0, y: 3, w: 8, h: 5 } },
      { widget_type: 'gauge', title: 'יעד MRR', metric: 'mrr', config: { format: 'currency' }, layout: { x: 8, y: 3, w: 4, h: 5 } },
    ],
  },
  {
    key: 'product', department: 'product', name: 'מוצר',
    widgets: [
      kpi(9, 'dau', 'DAU', 'number'),
      kpi(6, 'mau', 'MAU', 'number'),
      kpi(3, 'retention_d30', 'Retention D30', 'percent'),
      kpi(0, 'adoption', 'Adoption', 'percent'),
      { widget_type: 'funnel', title: 'משפך אונבורדינג', metric: 'onboarding_funnel', layout: { x: 0, y: 3, w: 6, h: 5 } },
      { widget_type: 'line', title: 'DAU/MAU', metric: 'dau_mau', config: { format: 'number' }, layout: { x: 6, y: 3, w: 6, h: 5 } },
    ],
  },
  {
    key: 'ecommerce', department: 'ecommerce', name: 'חנות (Store)',
    widgets: [
      kpi(9, 'sales', 'מכירות', 'currency'),
      kpi(6, 'aov', 'AOV', 'currency'),
      kpi(3, 'cart_abandon', 'נטישת עגלה', 'percent'),
      kpi(0, 'repeat_rate', 'רכישה חוזרת', 'percent'),
      { widget_type: 'bar', title: 'מוצרים מובילים', metric: 'top_products', config: { format: 'number' }, layout: { x: 0, y: 3, w: 6, h: 5 } },
      { widget_type: 'line', title: 'מכירות לאורך זמן', metric: 'sales_trend', config: { format: 'currency' }, layout: { x: 6, y: 3, w: 6, h: 5 } },
    ],
  },
  {
    key: 'support', department: 'support', name: 'שירות (Support)',
    widgets: [
      kpi(9, 'open_tickets', 'פניות פתוחות', 'number'),
      kpi(6, 'response_time', 'זמן תגובה (שעות)', 'number'),
      kpi(3, 'csat', 'CSAT', 'percent'),
      kpi(0, 'nps', 'NPS', 'number'),
      { widget_type: 'line', title: 'פניות לאורך זמן', metric: 'tickets_trend', config: { format: 'number' }, layout: { x: 0, y: 3, w: 8, h: 5 } },
      { widget_type: 'gauge', title: 'יעד CSAT', metric: 'csat', config: { format: 'percent', target: 95 }, layout: { x: 8, y: 3, w: 4, h: 5 } },
    ],
  },
  {
    key: 'hr', department: 'hr', name: 'HR / כוח אדם',
    widgets: [
      kpi(9, 'headcount', 'מצבת עובדים', 'number'),
      kpi(6, 'attrition', 'נטישה', 'percent'),
      kpi(3, 'time_to_hire', 'ימים לגיוס', 'number'),
      kpi(0, 'open_roles', 'משרות פתוחות', 'number'),
      { widget_type: 'funnel', title: 'משפך גיוס', metric: 'hiring_funnel', layout: { x: 0, y: 3, w: 6, h: 5 } },
      { widget_type: 'bar', title: 'מצבת לפי מחלקה', metric: 'headcount_by_dept', config: { format: 'number' }, layout: { x: 6, y: 3, w: 6, h: 5 } },
    ],
  },
  {
    key: 'reputation', department: 'reputation', name: 'מוניטין (Brand)',
    widgets: [
      kpi(9, 'reputation_score', 'Reputation Score', 'number'),
      kpi(6, 'mentions', 'אזכורים', 'number'),
      kpi(3, 'sentiment', 'סנטימנט חיובי', 'percent'),
      kpi(0, 'avg_rating', 'דירוג ממוצע', 'number'),
      { widget_type: 'line', title: 'סנטימנט לאורך זמן', metric: 'sentiment_trend', config: { format: 'percent' }, layout: { x: 0, y: 3, w: 8, h: 5 } },
      { widget_type: 'table', title: 'אזכורים אחרונים', metric: 'recent_mentions', layout: { x: 8, y: 3, w: 4, h: 5 } },
    ],
  },
  {
    key: 'startup', department: 'startup', name: 'סטארטאפ (AARRR)',
    widgets: [
      kpi(9, 'acquisition', 'Acquisition', 'number'),
      kpi(6, 'activation', 'Activation', 'percent'),
      kpi(3, 'retention', 'Retention', 'percent'),
      kpi(0, 'burn_runway', 'Runway (חודשים)', 'number'),
      { widget_type: 'funnel', title: 'משפך Pirate (AARRR)', metric: 'aarrr_funnel', layout: { x: 0, y: 3, w: 6, h: 5 } },
      { widget_type: 'line', title: 'הכנסה + burn', metric: 'revenue_burn', config: { format: 'currency' }, layout: { x: 6, y: 3, w: 6, h: 5 } },
    ],
  },
  {
    key: 'executive', department: 'executive', name: 'Executive Overview',
    widgets: [
      kpi(9, 'revenue', 'הכנסה', 'currency'),
      kpi(6, 'cash_balance', 'מזומן', 'currency'),
      kpi(3, 'leads', 'לידים', 'number'),
      kpi(0, 'growth', 'צמיחה', 'percent'),
      { widget_type: 'line', title: 'הכנסה חוצה-מחלקות', metric: 'company_revenue', config: { format: 'currency' }, layout: { x: 0, y: 3, w: 8, h: 5 } },
      { widget_type: 'bar', title: 'תרומה לפי מחלקה', metric: 'dept_contribution', config: { format: 'currency' }, layout: { x: 8, y: 3, w: 4, h: 5 } },
    ],
  },
];

export function templateByKey(key: string): DepartmentTemplate | undefined {
  return TEMPLATES.find((t) => t.key === key);
}

// Vertical bundles (spec §0.15) — a business type → the dashboards it gets.
export const VERTICALS: Vertical[] = [
  { key: 'ecommerce', emoji: '🛒', name: 'חנות E-commerce', dashboards: ['ecommerce', 'marketing', 'finance'], signatureKpis: ['AOV', 'נטישת עגלה', 'ROAS'] },
  { key: 'saas', emoji: '☁️', name: 'מערכת SaaS', dashboards: ['saas', 'product', 'marketing', 'sales'], signatureKpis: ['MRR', 'Churn', 'CAC:LTV'] },
  { key: 'accounting', emoji: '🧾', name: 'משרד רו״ח', dashboards: ['finance', 'executive'], signatureKpis: ['תזרים', 'מע״מ', 'לקוחות באיחור'] },
  { key: 'agency', emoji: '📣', name: 'סוכנות', dashboards: ['marketing', 'sales', 'finance'], signatureKpis: ['ROAS-per-לקוח', 'pipeline', 'רווחיות'] },
  { key: 'b2b', emoji: '💼', name: 'B2B / ייעוץ', dashboards: ['sales', 'finance', 'support'], signatureKpis: ['win-rate', 'pipeline-velocity', 'CSAT'] },
  { key: 'retail', emoji: '🍽️', name: 'מסעדה / קמעונאות', dashboards: ['ecommerce', 'reputation', 'finance'], signatureKpis: ['מכירות יומיות', 'ביקורות', 'מלאי'] },
  { key: 'clinic', emoji: '🩺', name: 'קליניקה / מטפל', dashboards: ['finance', 'reputation'], signatureKpis: ['תפוסה', 'הכנסה-per-מטופל', 'ביקורות'] },
  { key: 'realestate', emoji: '🏠', name: 'נדל״ן / תיווך', dashboards: ['sales', 'marketing'], signatureKpis: ['לידים', 'עסקאות', 'מקור-ליד'] },
  { key: 'local', emoji: '🔧', name: 'עסק מקומי', dashboards: ['sales', 'reputation', 'finance'], signatureKpis: ['תורים', 'ביקורות', 'הכנסה'] },
  { key: 'startup', emoji: '🚀', name: 'סטארטאפ', dashboards: ['startup', 'product', 'sales'], signatureKpis: ['AARRR', 'burn/runway', 'retention'] },
];
