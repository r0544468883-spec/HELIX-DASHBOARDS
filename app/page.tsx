import Link from 'next/link';
import { TEMPLATES, VERTICALS } from '@/lib/templates';
import { modelInUse } from '@/lib/ollama';
import VerticalGrid from '@/components/VerticalGrid';

export const dynamic = 'force-dynamic';

// Home — onboarding surface. Design pass (taste-skill): trust-first product-home,
// restrained dials — real type hierarchy, generous rhythm, no AI-default patterns.
export default function Home() {
  const model = modelInUse();
  return (
    <>
      {/* Sticky header, separated from the hero by a hairline — not floating chrome. */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="max-w-[1120px] mx-auto px-5 md:px-10 h-14 flex items-center justify-between">
          <span className="font-black tracking-tight">HELIX<span className="text-emerald-600"> DASHBOARDS</span></span>
          <nav className="flex items-center gap-4 text-[13px] font-semibold text-[var(--ink-secondary)]">
            <Link href="/connect" className="hover:text-[var(--ink)] transition-colors">חיבורים</Link>
            <Link href="/digest" className="hover:text-[var(--ink)] transition-colors">סיכומים</Link>
            <Link href="/deals" className="hover:text-[var(--ink)] transition-colors">צנרת</Link>
            <Link href="/login" className="rounded-lg bg-[var(--ink)] text-[var(--bg)] px-3 py-1.5 hover:opacity-90 transition-opacity">התחברות</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1120px] mx-auto px-5 md:px-10">
        {/* Hero — eyebrow / headline / subhead hierarchy, generous vertical space. */}
        <section className="pt-16 pb-14 md:pt-24 md:pb-20 max-w-[720px]">
          <div className="inline-flex items-center gap-2 text-[12px] font-bold text-emerald-600 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            פלטפורמת BI עברית-first לכל העסק
          </div>
          <h1 className="text-[clamp(32px,6vw,56px)] font-black leading-[1.05] tracking-tight mb-5">
            כל המספרים של העסק שלך,<br />במקום אחד.
          </h1>
          <p className="text-[var(--ink-secondary)] text-[clamp(15px,2.5vw,19px)] leading-relaxed mb-8">
            בחר את סוג העסק שלך — ונרכיב לך את הדשבורדים הנכונים תוך שנייה. עדכונים אוטומטיים, סיכום יומי חכם,
            ומסירה ישירה לוואטסאפ או טלגרם.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href="#verticals" className="rounded-xl bg-emerald-600 text-white px-6 py-3 text-[15px] font-bold hover:bg-emerald-700 transition-colors">
              התחל — בחר סוג עסק
            </a>
            <Link href="/connect" className="rounded-xl border border-[var(--border)] px-6 py-3 text-[15px] font-bold hover:border-emerald-500 transition-colors">
              חבר מקור נתונים
            </Link>
            {model !== 'none' && (
              <span className="text-[12px] text-[var(--ink-secondary)] rounded-full bg-black/5 px-3 py-1">
                מנוע נרטיב: {model === 'ollama' ? 'Ollama (מקומי)' : 'Claude'}
              </span>
            )}
          </div>
        </section>

        {/* Verticals */}
        <section id="verticals" className="scroll-mt-20 pb-16">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-[20px] font-black tracking-tight">לפי סוג עסק</h2>
            <span className="text-[13px] text-[var(--ink-secondary)]">{VERTICALS.length} חבילות מוכנות</span>
          </div>
          <VerticalGrid verticals={VERTICALS} />
        </section>

        {/* Department gallery — cards with hierarchy + affordance, subtle lift. */}
        <section className="pb-24">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-[20px] font-black tracking-tight">כל הדשבורדים</h2>
            <span className="text-[13px] text-[var(--ink-secondary)]">{TEMPLATES.length} מחלקות</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TEMPLATES.map((t) => (
              <Link key={t.key} href={`/dashboard/${t.key}`}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="text-[15px] font-bold">{t.name}</div>
                  <span className="text-[var(--ink-secondary)] group-hover:text-emerald-600 transition-colors">←</span>
                </div>
                <div className="text-[12px] text-[var(--ink-secondary)] mt-1">{t.widgets.length} widgets</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
