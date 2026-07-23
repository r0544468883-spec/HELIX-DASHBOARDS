// WhatsApp TEMPLATE CATALOG — one approved template per PROACTIVE message HELIX
// DASHBOARDS sends (scheduled digest, metric-threshold/anomaly alert, weekly
// summary, connector-sync failure). Templates are the compliant way to open a
// conversation outside the 24h window (Meta §business-initiated). Each entry is BOTH:
//   1. a Meta registration payload (used by /api/templates/sync to create them), and
//   2. a runtime mapping (name + language + how to build the ordered {{n}} params)
//      used by the digest/alert delivery path to send via sendWhatsAppTemplate().
// Body copy mirrors the in-app digest strings so in-window (free-text) and
// out-of-window (template) sends read identically.

export type TemplateCategory = 'UTILITY' | 'MARKETING';

export type TemplateDef = {
  /** WhatsApp template name (a–z0–9_ only, unique per WABA). */
  name: string;
  language: string; // 'he'
  category: TemplateCategory;
  /** Body with {{1}},{{2}}… placeholders, exactly as registered with Meta. */
  body: string;
  /** Human-readable list of what each {{n}} is, for the example block + docs. */
  params: string[];
  /** Optional dynamic URL button (e.g. open-dashboard link). {{1}} = suffix. */
  urlButton?: { text: string; baseUrl: string }; // full url = baseUrl + {{1}}
  sampleParams: string[];
  sampleUrlSuffix?: string;
};

// Proactive message → template. `key` matches the delivery Kind.
export const TEMPLATES: Record<string, TemplateDef> = {
  daily_digest: {
    name: 'dash_daily_digest',
    language: 'he',
    category: 'UTILITY',
    body: '📊 בוקר טוב {{1}}! הסיכום היומי של דשבורד "{{2}}" מוכן: {{3}}. לצפייה המלאה הקישו על הכפתור.',
    params: ['שם המשתמש', 'שם הדשבורד', 'שורת תקציר (למשל "הכנסה ₪42K, +8%")'],
    urlButton: { text: 'פתח דשבורד', baseUrl: '{{APP_URL}}/dashboard/' },
    sampleParams: ['רון', 'Executive Overview', 'הכנסה ₪42K (+8%), לידים 137'],
    sampleUrlSuffix: 'executive',
  },
  weekly_summary: {
    name: 'dash_weekly_summary',
    language: 'he',
    category: 'UTILITY',
    body: 'שלום {{1}} 👋 סיכום שבועי לדשבורד "{{2}}": {{3}}. שבוע טוב!',
    params: ['שם המשתמש', 'שם הדשבורד', 'שורת סיכום שבועי'],
    urlButton: { text: 'פתח דשבורד', baseUrl: '{{APP_URL}}/dashboard/' },
    sampleParams: ['רון', 'מכירות', 'צנרת ₪310K, אחוז סגירה 24%, 12 עסקאות שנסגרו'],
    sampleUrlSuffix: 'sales',
  },
  metric_alert: {
    name: 'dash_metric_alert',
    language: 'he',
    category: 'UTILITY',
    body: '🚨 התראה: המדד "{{1}}" בדשבורד "{{2}}" עמד על {{3}} — {{4}} מהסף שהגדרת ({{5}}). כדאי לבדוק.',
    params: ['שם המדד', 'שם הדשבורד', 'הערך הנוכחי', 'מעל/מתחת', 'ערך הסף'],
    urlButton: { text: 'בדוק עכשיו', baseUrl: '{{APP_URL}}/dashboard/' },
    sampleParams: ['נטישת עגלה', 'חנות', '38%', 'מעל', '30%'],
    sampleUrlSuffix: 'ecommerce',
  },
  anomaly_alert: {
    name: 'dash_anomaly_alert',
    language: 'he',
    category: 'UTILITY',
    body: '📉 חריגה זוהתה: "{{1}}" ב"{{2}}" השתנה ב-{{3}} מול הממוצע ({{4}} → {{5}}). כדאי לבדוק מה קרה.',
    params: ['שם המדד', 'שם הדשבורד', 'אחוז שינוי', 'ערך קודם', 'ערך נוכחי'],
    urlButton: { text: 'פתח דשבורד', baseUrl: '{{APP_URL}}/dashboard/' },
    sampleParams: ['ROAS', 'שיווק', '-42%', '3.1', '1.8'],
    sampleUrlSuffix: 'marketing',
  },
  sync_failed: {
    name: 'dash_sync_failed',
    language: 'he',
    category: 'UTILITY',
    body: '⚠️ שלום {{1}}, סנכרון הנתונים ממקור "{{2}}" נכשל ({{3}}). הדשבורדים עלולים להציג נתונים לא מעודכנים — כדאי לחבר מחדש.',
    params: ['שם המשתמש', 'שם המקור', 'סיבת הכשל'],
    urlButton: { text: 'תקן חיבור', baseUrl: '{{APP_URL}}/connect' },
    sampleParams: ['רון', 'HELIX SDR-BDR', 'הרשאה פגה'],
    sampleUrlSuffix: '',
  },
};

/** Runtime: build the ordered {{n}} params a template expects from render context. */
export function templateParams(key: string, ctx: {
  user?: string; dashboard?: string; summary?: string; metric?: string;
  value?: string; direction?: string; threshold?: string; changePct?: string;
  prev?: string; current?: string; source?: string; reason?: string;
}): { def: TemplateDef; params: string[]; urlSuffix?: string } | null {
  const def = TEMPLATES[key];
  if (!def) return null;
  const map: Record<string, string[]> = {
    daily_digest: [ctx.user ?? '', ctx.dashboard ?? '', ctx.summary ?? ''],
    weekly_summary: [ctx.user ?? '', ctx.dashboard ?? '', ctx.summary ?? ''],
    metric_alert: [ctx.metric ?? '', ctx.dashboard ?? '', ctx.value ?? '', ctx.direction ?? '', ctx.threshold ?? ''],
    anomaly_alert: [ctx.metric ?? '', ctx.dashboard ?? '', ctx.changePct ?? '', ctx.prev ?? '', ctx.current ?? ''],
    sync_failed: [ctx.user ?? '', ctx.source ?? '', ctx.reason ?? ''],
  };
  return { def, params: map[key] ?? [] };
}

/** Build the Meta message_templates registration payload for one template. */
export function registrationPayload(def: TemplateDef, appUrl: string): Record<string, unknown> {
  const components: Record<string, unknown>[] = [
    { type: 'BODY', text: def.body, example: { body_text: [def.sampleParams] } },
  ];
  if (def.urlButton) {
    const base = def.urlButton.baseUrl.replace('{{APP_URL}}', appUrl.replace(/\/$/, ''));
    components.push({
      type: 'BUTTONS',
      buttons: [{ type: 'URL', text: def.urlButton.text, url: `${base}{{1}}`, example: [`${base}${def.sampleUrlSuffix ?? 'sample'}`] }],
    });
  }
  return { name: def.name, language: def.language, category: def.category, components };
}

export function allRegistrationPayloads(appUrl: string): Record<string, unknown>[] {
  return Object.values(TEMPLATES).map((d) => registrationPayload(d, appUrl));
}

/** Registration payloads for an explicit list of defs (built-in ∪ custom). */
export function registrationPayloadsFor(defs: TemplateDef[], appUrl: string): Record<string, unknown>[] {
  return defs.map((d) => registrationPayload(d, appUrl));
}
