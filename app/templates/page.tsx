'use client';
// Templates manager — view built-in WhatsApp templates and upload/edit/delete your
// OWN. A custom entry with the same key OVERRIDES the built-in. Talks to
// /api/templates/{list,custom}. WhatsApp-only (proactive out-of-window messages).
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type WaItem = {
  key: string; name: string; language: string; category: string; body: string;
  params: string[]; sampleParams: string[];
  urlButton: { text: string; baseUrl: string } | null;
  quickReply: string[] | null; source: string; overrides: boolean;
};

type EditorData = {
  key: string; name: string; language: string; category: string; body: string;
  params: string; sampleParams: string; quickReply: string; urlText: string; urlBase: string;
};

const inp = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[14px] outline-none focus:border-emerald-500';

export default function TemplatesPage() {
  const [wa, setWa] = useState<WaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [editor, setEditor] = useState<{ data: EditorData; isNew: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/templates/list');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'load failed');
      setWa(j.whatsapp ?? []);
    } catch {
      setStatus({ kind: 'err', text: 'טעינת התבניות נכשלה' });
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const newWa = () => setEditor({ isNew: true, data: { key: '', name: '', language: 'he', category: 'UTILITY', body: '', params: '', sampleParams: '', quickReply: '', urlText: '', urlBase: '' } });
  const editWa = (i: WaItem, asClone: boolean) => setEditor({
    isNew: asClone,
    data: {
      key: asClone ? `${i.key}_custom` : i.key,
      name: asClone ? `${i.name}_custom`.slice(0, 60) : i.name,
      language: i.language, category: i.category, body: i.body,
      params: i.params.join(', '), sampleParams: i.sampleParams.join(', '),
      quickReply: (i.quickReply ?? []).join(', '),
      urlText: i.urlButton?.text ?? '', urlBase: i.urlButton?.baseUrl ?? '',
    },
  });

  const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
  const patch = (p: Partial<EditorData>) => setEditor((e) => (e ? { ...e, data: { ...e.data, ...p } } : e));

  const save = async () => {
    if (!editor) return;
    const d = editor.data;
    if (!d.key.trim()) return setStatus({ kind: 'err', text: 'חובה מפתח (key)' });
    if (!/^[a-z0-9_]+$/.test(d.name)) return setStatus({ kind: 'err', text: 'שם התבנית ב-Meta חייב להיות a-z0-9_ בלבד' });
    setSaving(true); setStatus(null);
    try {
      const definition: Record<string, unknown> = {
        name: d.name.trim(), language: d.language.trim() || 'he', category: d.category, body: d.body,
        params: splitList(d.params), sampleParams: splitList(d.sampleParams),
      };
      if (d.quickReply.trim()) definition.quickReply = splitList(d.quickReply);
      if (d.urlText.trim() && d.urlBase.trim()) definition.urlButton = { text: d.urlText.trim(), baseUrl: d.urlBase.trim() };
      const r = await fetch('/api/templates/custom', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'whatsapp', key: d.key.trim(), definition }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.results?.[0]?.error || j.error || 'שמירה נכשלה');
      setEditor(null);
      setStatus({ kind: 'ok', text: 'התבנית נשמרה ✓' });
      load();
    } catch (e) {
      setStatus({ kind: 'err', text: e instanceof Error ? e.message : 'שמירה נכשלה' });
    }
    setSaving(false);
  };

  const remove = async (key: string) => {
    if (!confirm(`למחוק את "${key}"? (חוזר לתבנית המובנית אם קיימת)`)) return;
    try {
      const r = await fetch(`/api/templates/custom?kind=whatsapp&key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'מחיקה נכשלה');
      setStatus({ kind: 'ok', text: 'התבנית נמחקה' });
      load();
    } catch (e) {
      setStatus({ kind: 'err', text: e instanceof Error ? e.message : 'מחיקה נכשלה' });
    }
  };

  return (
    <main className="max-w-[880px] mx-auto px-5 md:px-8 py-8">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div>
          <Link href="/dashboard" className="text-[12px] font-bold text-emerald-600">← לדשבורדים</Link>
          <h1 className="text-[28px] font-black tracking-tight">ניהול תבניות WhatsApp</h1>
        </div>
        <button onClick={newWa} className="text-[13px] font-bold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">+ תבנית חדשה</button>
      </div>
      <p className="text-[14px] text-[var(--ink-secondary)] mb-5 max-w-[640px]">
        צפייה בתבניות המובנות והעלאת תבניות משלך להודעות יזומות (מחוץ לחלון 24 השעות). תבנית מותאמת עם אותו מפתח דורסת את המובנית.
      </p>

      {status && (
        <div className={`mb-4 rounded-lg px-3 py-2 text-[13px] font-medium ${status.kind === 'ok' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`} role="status">
          {status.text}
        </div>
      )}

      {loading ? (
        <div className="text-[var(--ink-secondary)] text-center py-16">טוען…</div>
      ) : wa.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] text-center py-16 text-[var(--ink-secondary)]">
          אין תבניות עדיין. הוסיפו תבנית ראשונה עם &quot;+ תבנית חדשה&quot;.
        </div>
      ) : (
        <div className="grid gap-2.5">
          {wa.map((i) => (
            <div key={i.key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex gap-3 items-center">
              <div className="flex-1 min-w-0">
                <div className="flex gap-2 items-center flex-wrap mb-1">
                  <strong className="text-[14px]">{i.name}</strong>
                  <Badge tone={i.category === 'MARKETING' ? 'warn' : 'slate'}>{i.category}</Badge>
                  {i.source === 'custom'
                    ? <Badge tone="ok">{i.overrides ? 'דורס מובנה' : 'מותאם'}</Badge>
                    : <Badge tone="slate">מובנה</Badge>}
                  {i.quickReply && <Badge tone="cyan">Quick-Reply</Badge>}
                  {i.urlButton && <Badge tone="cyan">כפתור URL</Badge>}
                </div>
                <div className="text-[12.5px] text-[var(--ink-secondary)] truncate">{i.body}</div>
              </div>
              <button onClick={() => editWa(i, i.source !== 'custom')} className="text-[12.5px] font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-emerald-500 whitespace-nowrap">
                {i.source === 'custom' ? 'ערוך' : 'שכפל כמותאם'}
              </button>
              {i.source === 'custom' && (
                <button onClick={() => remove(i.key)} className="text-[12.5px] font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] text-red-600 hover:border-red-500 whitespace-nowrap">מחק</button>
              )}
            </div>
          ))}
        </div>
      )}

      {editor && (
        <div onClick={() => setEditor(null)} className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-y-auto p-4 md:p-10 z-50">
          <div onClick={(e) => e.stopPropagation()} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-[560px]">
            <h2 className="text-[18px] font-bold mb-4">{editor.isNew ? 'תבנית WhatsApp חדשה' : 'עריכת תבנית'}</h2>
            <div className="grid gap-3">
              <Field label="מפתח (key)"><input className={inp} value={editor.data.key} onChange={(e) => patch({ key: e.target.value })} placeholder="למשל promo / renewal" /></Field>
              <Field label="שם התבנית ב-Meta (a-z0-9_)"><input className={inp} dir="ltr" value={editor.data.name} onChange={(e) => patch({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} placeholder="my_promo" /></Field>
              <div className="flex gap-3">
                <Field label="קטגוריה"><select className={inp} value={editor.data.category} onChange={(e) => patch({ category: e.target.value })}><option value="UTILITY">UTILITY</option><option value="MARKETING">MARKETING</option></select></Field>
                <Field label="שפה"><input className={inp} value={editor.data.language} onChange={(e) => patch({ language: e.target.value })} placeholder="he" /></Field>
              </div>
              <Field label="גוף ההודעה ({{1}}, {{2}}…)"><textarea className={`${inp} min-h-[90px] resize-y`} value={editor.data.body} onChange={(e) => patch({ body: e.target.value })} /></Field>
              <Field label="פרמטרים (תיאור, מופרד בפסיקים)"><input className={inp} value={editor.data.params} onChange={(e) => patch({ params: e.target.value })} placeholder="שם, דשבורד, סיכום" /></Field>
              <Field label="דוגמאות לפרמטרים (מופרד בפסיקים)"><input className={inp} value={editor.data.sampleParams} onChange={(e) => patch({ sampleParams: e.target.value })} placeholder="רון, מכירות, ₪42K (+8%)" /></Field>
              <Field label="כפתורי Quick-Reply (אופציונלי, מופרד בפסיקים)"><input className={inp} value={editor.data.quickReply} onChange={(e) => patch({ quickReply: e.target.value })} placeholder="אישור, ביטול" /></Field>
              <div className="flex gap-3">
                <Field label="טקסט כפתור URL (אופציונלי)"><input className={inp} value={editor.data.urlText} onChange={(e) => patch({ urlText: e.target.value })} placeholder="פתח דשבורד" /></Field>
                <Field label="בסיס ה-URL"><input className={inp} dir="ltr" value={editor.data.urlBase} onChange={(e) => patch({ urlBase: e.target.value })} placeholder="{{APP_URL}}/dashboard/" /></Field>
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={save} disabled={saving} className="text-[13px] font-bold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">{saving ? 'שומר…' : 'שמירה'}</button>
              <button onClick={() => setEditor(null)} className="text-[13px] font-bold px-4 py-2 rounded-lg border border-[var(--border)]">ביטול</button>
            </div>
            <p className="text-[12px] text-[var(--ink-secondary)] mt-3">אחרי שמירה — הריצו סנכרון (/api/templates/sync) ואשרו את התבנית ב-WhatsApp Manager לפני שליחה מחוץ לחלון.</p>
          </div>
        </div>
      )}
    </main>
  );
}

function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'slate' | 'cyan'; children: React.ReactNode }) {
  const map: Record<string, string> = {
    ok: 'bg-emerald-500/15 text-emerald-600',
    warn: 'bg-amber-500/15 text-amber-600',
    slate: 'bg-slate-500/15 text-[var(--ink-secondary)]',
    cyan: 'bg-cyan-500/15 text-cyan-600',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${map[tone]}`}>{children}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block flex-1">
      <span className="block text-[12px] text-[var(--ink-secondary)] mb-1.5">{label}</span>
      {children}
    </label>
  );
}
