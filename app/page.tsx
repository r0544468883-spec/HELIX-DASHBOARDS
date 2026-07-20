import Link from 'next/link';
import { TEMPLATES, VERTICALS } from '@/lib/templates';
import { modelInUse } from '@/lib/ollama';

export const dynamic = 'force-dynamic';

// Home — the onboarding surface: pick your business type (vertical) to load a
// bundle, or jump straight into any department dashboard from the gallery.
export default function Home() {
  const model = modelInUse();
  return (
    <main className="max-w-[1120px] mx-auto px-5 md:px-10 py-10">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[13px] font-bold text-emerald-600">HELIX DASHBOARDS</div>
        <div className="flex items-center gap-3 text-[13px] font-semibold">
          <Link href="/connect" className="text-[var(--ink-secondary)] hover:text-[var(--ink)]">🔌 חיבורים</Link>
          <Link href="/login" className="text-[var(--ink-secondary)] hover:text-[var(--ink)]">התחברות</Link>
        </div>
      </div>
      <h1 className="text-[clamp(26px,5vw,40px)] font-black tracking-tight mb-1">הדשבורדים של העסק שלך</h1>
      <p className="text-[var(--ink-secondary)] text-[15px] mb-8">
        בחר את סוג העסק שלך — ונטען לך את הדשבורדים המתאימים. הכל בעברית, עם עדכונים אוטומטיים ומסירה בוואטסאפ/טלגרם.
        {model !== 'none' && <span className="mr-2 rounded-full bg-black/5 px-2 py-0.5 text-[12px]">מנוע: {model === 'ollama' ? 'Ollama (מקומי)' : 'Claude'}</span>}
      </p>

      <h2 className="text-[15px] font-bold mb-3">לפי סוג עסק</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        {VERTICALS.map((v) => (
          <Link key={v.key} href={`/dashboard/${v.dashboards[0]}?vertical=${v.key}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-emerald-500 transition-colors">
            <div className="text-[24px] mb-1">{v.emoji}</div>
            <div className="text-[14px] font-bold">{v.name}</div>
            <div className="text-[11px] text-[var(--ink-secondary)] mt-1">{v.dashboards.length} דשבורדים · {v.signatureKpis.slice(0, 2).join(' · ')}</div>
          </Link>
        ))}
      </div>

      <h2 className="text-[15px] font-bold mb-3">כל הדשבורדים (לפי מחלקה)</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TEMPLATES.map((t) => (
          <Link key={t.key} href={`/dashboard/${t.key}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-emerald-500 transition-colors">
            <div className="text-[14px] font-bold">{t.name}</div>
            <div className="text-[11px] text-[var(--ink-secondary)] mt-1">{t.widgets.length} widgets</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
