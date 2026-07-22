'use client';

import { useState } from 'react';

// Field spec per key-based provider (GA4 uses Google OAuth instead).
type Field = { key: string; label: string; placeholder: string };
const PROVIDERS: { id: string; name: string; emoji: string; oauth?: boolean; fields?: Field[] }[] = [
  { id: 'ga4', name: 'Google Analytics 4', emoji: '📈', oauth: true, fields: [{ key: 'propertyId', label: 'GA4 Property ID', placeholder: 'מספר' }] },
  { id: 'meta_ads', name: 'Meta Ads', emoji: '📣', fields: [
    { key: 'access_token', label: 'Access Token', placeholder: 'EAAB…' },
    { key: 'ad_account_id', label: 'Ad Account ID', placeholder: 'act_123…' },
  ] },
  { id: 'stripe', name: 'Stripe', emoji: '💳', fields: [{ key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_…' }] },
  { id: 'shopify', name: 'Shopify', emoji: '🛒', fields: [
    { key: 'shop', label: 'Shop domain', placeholder: 'xxx.myshopify.com' },
    { key: 'access_token', label: 'Admin API token', placeholder: 'shpat_…' },
  ] },
  { id: 'plausible', name: 'Plausible', emoji: '📊', fields: [
    { key: 'site_id', label: 'Site ID', placeholder: 'example.com' },
    { key: 'api_key', label: 'API Key', placeholder: 'xxxxx' },
  ] },
  { id: 'mailchimp', name: 'Mailchimp', emoji: '✉️', fields: [
    { key: 'api_key', label: 'API Key', placeholder: 'xxxx-usXX' },
  ] },
  { id: 'ravmesser', name: 'רב-מסר (Responder)', emoji: '📨', fields: [
    { key: 'api_key', label: 'User Key', placeholder: 'מ-support@responder.co.il' },
    { key: 'api_secret', label: 'User Secret', placeholder: 'אופציונלי' },
  ] },
  { id: 'activetrail', name: 'ActiveTrail', emoji: '📩', fields: [
    { key: 'api_key', label: 'API Key', placeholder: 'מהגדרות ActiveTrail → API' },
  ] },
  { id: 'inforu', name: 'InforU', emoji: '📧', fields: [
    { key: 'api_key', label: 'API Key', placeholder: 'מחשבון InforU (Basic token)' },
  ] },
  { id: 'helix_ops', name: 'HELIX OPS (קמפיינים A/B)', emoji: '🅰️🅱️', fields: [
    { key: 'base_url', label: 'HELIX OPS URL', placeholder: 'https://ops.helix…' },
    { key: 'api_key', label: 'Export Secret', placeholder: 'xxxx' },
    { key: 'ops_workspace_id', label: 'OPS Workspace ID', placeholder: 'uuid' },
  ] },
  { id: 'helix_sdr', name: 'HELIX SDR-BDR (מכירות + מחזור לקוח)', emoji: '🤖', fields: [
    { key: 'base_url', label: 'HELIX SDR URL', placeholder: 'https://sdr.helix…' },
    { key: 'api_key', label: 'Export Secret', placeholder: 'xxxx' },
    { key: 'sdr_workspace_id', label: 'SDR Workspace ID', placeholder: 'uuid' },
  ] },
];

export default function ConnectPage() {
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  function set(pid: string, k: string, v: string) {
    setValues((s) => ({ ...s, [pid]: { ...(s[pid] ?? {}), [k]: v } }));
  }

  async function sync(pid: string) {
    setBusy(pid); setMsg((m) => ({ ...m, [pid]: '' }));
    const cfg = values[pid] ?? {};
    try {
      const endpoint = pid === 'ga4' ? '/api/connectors/ga4/sync' : '/api/connectors/sync';
      const body = pid === 'ga4' ? { propertyId: cfg.propertyId } : { provider: pid, config: cfg };
      const res = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'error');
      setMsg((m) => ({ ...m, [pid]: `✓ סונכרנו ${json.synced} נקודות. חזור לדשבורד.` }));
    } catch (e) {
      setMsg((m) => ({ ...m, [pid]: 'שגיאה: ' + (e as Error).message }));
    } finally { setBusy(null); }
  }

  return (
    <main className="max-w-[720px] mx-auto px-5 md:px-8 py-10">
      <div className="mb-1 text-[13px] font-bold text-emerald-600">HELIX DASHBOARDS</div>
      <h1 className="text-[28px] font-black tracking-tight mb-1">חיבור מקורות נתונים</h1>
      <p className="text-[var(--ink-secondary)] text-[15px] mb-6">חבר את המערכות שלך — הנתונים יזרמו לדשבורדים אוטומטית (כולל סנכרון יומי).</p>

      <div className="space-y-3">
        {PROVIDERS.map((p) => (
          <div key={p.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[22px]">{p.emoji}</span>
                <div className="text-[15px] font-bold">{p.name}</div>
              </div>
              {p.oauth && <a href="/api/google/auth" className="text-[13px] font-bold px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">חבר Google</a>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 items-center border-t border-[var(--border)] pt-3">
              {p.fields?.map((f) => (
                <input key={f.key} dir="ltr" placeholder={f.label + ' — ' + f.placeholder}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] flex-1 min-w-[160px] outline-none focus:border-emerald-500"
                  value={values[p.id]?.[f.key] ?? ''} onChange={(e) => set(p.id, f.key, e.target.value)} />
              ))}
              <button onClick={() => sync(p.id)} disabled={busy === p.id}
                className="text-[13px] font-bold px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-50">
                {busy === p.id ? 'מסנכרן…' : 'סנכרן'}
              </button>
            </div>
            {msg[p.id] && <p className="mt-2 text-[13px]">{msg[p.id]}</p>}
          </div>
        ))}
      </div>
    </main>
  );
}
