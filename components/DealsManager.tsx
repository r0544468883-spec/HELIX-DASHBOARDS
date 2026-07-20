'use client';

import { useState } from 'react';
import { addDeal, setDealStage } from '@/app/actions-deals';

export type Deal = { id: string; title: string; company: string | null; value: number; stage: string };

const STAGES: [string, string][] = [
  ['new', 'חדש'], ['qualified', 'מוסמך'], ['proposal', 'הצעה'], ['won', 'נסגר ✓'], ['lost', 'אבוד'],
];
const money = (n: number) => '₪' + Number(n).toLocaleString('he-IL', { maximumFractionDigits: 0 });

// Kanban-lite deals board — add deals and move stages. Each change recomputes the
// Sales dashboard metrics server-side.
export default function DealsManager({ initial }: { initial: Deal[] }) {
  const [deals, setDeals] = useState<Deal[]>(initial);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    if (!title.trim()) return setMsg('צריך שם עסקה.');
    setBusy(true); setMsg(null);
    const res = await addDeal({ title: title.trim(), company: company.trim() || undefined, value: Number(value) || 0 });
    setBusy(false);
    if ('error' in res && res.error) return setMsg('שגיאה: ' + res.error);
    // optimistic: prepend (id unknown → reload-free display with temp id)
    setDeals((d) => [{ id: 'tmp-' + d.length, title: title.trim(), company: company.trim() || null, value: Number(value) || 0, stage: 'new' }, ...d]);
    setTitle(''); setCompany(''); setValue('');
  }

  async function move(id: string, stage: string) {
    setDeals((d) => d.map((x) => (x.id === id ? { ...x, stage } : x)));
    if (!id.startsWith('tmp-')) await setDealStage(id, stage);
  }

  const inp = 'rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none focus:border-emerald-500';

  return (
    <div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-5 flex flex-wrap gap-2 items-center">
        <input className={inp + ' flex-1 min-w-[160px]'} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="שם העסקה" />
        <input className={inp + ' min-w-[140px]'} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="חברה" />
        <input className={inp + ' w-[130px]'} dir="ltr" value={value} onChange={(e) => setValue(e.target.value)} placeholder="שווי ₪" />
        <button onClick={add} disabled={busy} className="text-[13px] font-bold px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50">{busy ? 'מוסיף…' : '+ עסקה'}</button>
        {msg && <span className="text-[13px] text-red-600 w-full">{msg}</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STAGES.map(([key, label]) => {
          const col = deals.filter((d) => d.stage === key);
          const total = col.reduce((s, d) => s + Number(d.value), 0);
          return (
            <div key={key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="text-[13px] font-bold mb-1">{label}</div>
              <div className="text-[11px] text-[var(--ink-secondary)] mb-2">{col.length} · {money(total)}</div>
              <div className="space-y-2">
                {col.map((d) => (
                  <div key={d.id} className="rounded-lg border border-[var(--border)] p-2">
                    <div className="text-[13px] font-semibold truncate">{d.title}</div>
                    {d.company && <div className="text-[11px] text-[var(--ink-secondary)] truncate">{d.company}</div>}
                    <div className="text-[12px] font-bold text-emerald-600">{money(d.value)}</div>
                    <select value={d.stage} onChange={(e) => move(d.id, e.target.value)} className="mt-1 w-full text-[11px] rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5">
                      {STAGES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
