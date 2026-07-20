'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addWidget } from '@/app/actions-dashboards';

const WIDGET_TYPES = [
  { id: 'kpi', name: 'כרטיס KPI' },
  { id: 'line', name: 'גרף קו' },
  { id: 'bar', name: 'גרף עמודות' },
  { id: 'gauge', name: 'מד (מול יעד)' },
  { id: 'funnel', name: 'משפך' },
  { id: 'table', name: 'טבלה' },
];

// Add a widget from the library to this dashboard (drag-drop builder — mode 2).
export default function AddWidgetPanel({ department }: { department: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('kpi');
  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    if (!title.trim() || !metric.trim()) return setErr('צריך כותרת ומדד.');
    setBusy(true); setErr(null);
    const res = await addWidget(department, { widget_type: type, title: title.trim(), metric: metric.trim() });
    setBusy(false);
    if ('error' in res && res.error) return setErr('שגיאה: ' + res.error);
    setTitle(''); setMetric(''); setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[13px] font-bold px-4 py-2 rounded-lg bg-black/5 text-[var(--ink-secondary)] hover:text-[var(--ink)]">
        ➕ הוסף widget
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-wrap gap-2 items-center">
      <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px]">
        {WIDGET_TYPES.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת"
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] max-w-[160px] outline-none focus:border-emerald-500" />
      <input value={metric} onChange={(e) => setMetric(e.target.value)} dir="ltr" placeholder="metric (sessions/mrr/…)"
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] max-w-[180px] outline-none focus:border-emerald-500" />
      <button onClick={add} disabled={busy} className="text-[13px] font-bold px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50">{busy ? 'מוסיף…' : 'הוסף'}</button>
      <button onClick={() => setOpen(false)} className="text-[13px] text-[var(--ink-secondary)] px-2">ביטול</button>
      {err && <span className="text-[13px] text-red-600 w-full">{err}</span>}
    </div>
  );
}
