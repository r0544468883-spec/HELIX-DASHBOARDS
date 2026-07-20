'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardVertical } from '@/app/actions-dashboards';

type V = { key: string; emoji: string; name: string; dashboards: string[]; signatureKpis: string[] };

// Vertical picker (onboarding). Clicking a business type creates the workspace +
// instantiates its dashboard bundle; if not signed in, previews the first one.
// The "המלצת AI" button asks the model which dashboards to focus on.
export default function VerticalGrid({ verticals }: { verticals: V[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [rec, setRec] = useState<{ key: string; text: string } | null>(null);

  async function pick(v: V) {
    setBusy(v.key);
    const res = await onboardVertical(v.key);
    setBusy(null);
    if ('first' in res && res.first) return router.push(`/dashboard/${res.first}?vertical=${v.key}`);
    // Not signed in / error → preview the first dashboard.
    router.push(`/dashboard/${v.dashboards[0]}?vertical=${v.key}`);
  }

  async function recommend(v: V, e: React.MouseEvent) {
    e.stopPropagation();
    setBusy('rec-' + v.key);
    try {
      const res = await fetch('/api/recommend', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ vertical: v.key }) });
      const json = await res.json();
      setRec({ key: v.key, text: json.rationale });
    } finally { setBusy(null); }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
      {verticals.map((v) => (
        <div key={v.key} onClick={() => pick(v)}
          className="cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-emerald-500 transition-colors">
          <div className="text-[24px] mb-1">{v.emoji}</div>
          <div className="text-[14px] font-bold">{v.name}</div>
          <div className="text-[11px] text-[var(--ink-secondary)] mt-1">{v.dashboards.length} דשבורדים · {v.signatureKpis.slice(0, 2).join(' · ')}</div>
          <button onClick={(e) => recommend(v, e)} className="mt-2 text-[11px] font-semibold text-emerald-600 hover:underline">
            {busy === 'rec-' + v.key ? '…' : '🤖 המלצת AI'}
          </button>
          {busy === v.key && <div className="text-[11px] text-[var(--ink-secondary)] mt-1">מקים…</div>}
          {rec?.key === v.key && <div className="mt-2 text-[11px] text-[var(--ink-secondary)] border-t border-[var(--border)] pt-2">{rec.text}</div>}
        </div>
      ))}
    </div>
  );
}
