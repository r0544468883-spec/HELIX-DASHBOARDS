'use client';

import { useState } from 'react';

// Connections surface — connect data sources and sync them into metric_points.
// GA4 is the first live connector; others are placeholders per the reuse plan.
const PROVIDERS = [
  { id: 'ga4', name: 'Google Analytics 4', emoji: '📈', live: true },
  { id: 'meta_ads', name: 'Meta Ads', emoji: '📣', live: false },
  { id: 'stripe', name: 'Stripe', emoji: '💳', live: false },
  { id: 'shopify', name: 'Shopify', emoji: '🛒', live: false },
  { id: 'hubspot', name: 'HubSpot (CRM)', emoji: '🤝', live: false },
];

export default function ConnectPage() {
  const [propertyId, setPropertyId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function syncGa4() {
    if (!propertyId.trim()) return setMsg('הכנס GA4 Property ID.');
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/connectors/ga4/sync', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ propertyId: propertyId.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'error');
      setMsg(`✓ סונכרנו ${json.synced} נקודות נתונים. חזור לדשבורד השיווק.`);
    } catch (e) {
      setMsg('שגיאה: ' + (e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <main className="max-w-[720px] mx-auto px-5 md:px-8 py-10">
      <div className="mb-1 text-[13px] font-bold text-emerald-600">HELIX DASHBOARDS</div>
      <h1 className="text-[28px] font-black tracking-tight mb-1">חיבור מקורות נתונים</h1>
      <p className="text-[var(--ink-secondary)] text-[15px] mb-6">חבר את המערכות שלך — הנתונים יזרמו לדשבורדים אוטומטית.</p>

      <div className="space-y-3">
        {PROVIDERS.map((p) => (
          <div key={p.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[22px]">{p.emoji}</span>
                <div>
                  <div className="text-[15px] font-bold">{p.name}</div>
                  <div className="text-[12px] text-[var(--ink-secondary)]">{p.live ? 'זמין' : 'בקרוב'}</div>
                </div>
              </div>
              {p.live ? (
                <a href="/api/google/auth" className="text-[13px] font-bold px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">חבר Google</a>
              ) : (
                <span className="text-[13px] text-[var(--ink-secondary)] px-4 py-2">בקרוב</span>
              )}
            </div>
            {p.id === 'ga4' && (
              <div className="mt-3 flex flex-wrap gap-2 items-center border-t border-[var(--border)] pt-3">
                <input className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] max-w-[220px] outline-none focus:border-emerald-500" dir="ltr"
                  value={propertyId} onChange={(e) => setPropertyId(e.target.value)} placeholder="GA4 Property ID (מספר)" />
                <button onClick={syncGa4} disabled={busy} className="text-[13px] font-bold px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-50">
                  {busy ? 'מסנכרן…' : 'סנכרן עכשיו'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {msg && <p className="mt-4 text-[14px]">{msg}</p>}
    </main>
  );
}
