import Link from 'next/link';
import { notFound } from 'next/navigation';
import { templateByKey, VERTICALS } from '@/lib/templates';
import { resolveDashboard } from '@/lib/resolve-server';
import DashboardView from '@/components/DashboardView';
import DigestButton from '@/components/DigestButton';

export const dynamic = 'force-dynamic';

// A department dashboard. Resolves the template → widgets + (demo) data and hands
// them to the client canvas. `?vertical=` shows the sibling dashboards of a bundle.
export default async function DashboardPage({
  params, searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ vertical?: string }>;
}) {
  const { key } = await params;
  const { vertical } = await searchParams;
  if (!templateByKey(key)) notFound();

  const { name, widgets, dataById, persisted } = await resolveDashboard(key);
  const bundle = vertical ? VERTICALS.find((v) => v.key === vertical) : undefined;

  return (
    <main className="max-w-[1180px] mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <Link href="/" className="text-[12px] font-bold text-emerald-600">← HELIX DASHBOARDS</Link>
          <h1 className="text-[clamp(20px,4vw,30px)] font-black tracking-tight">{name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {key === 'sales' && <Link href="/deals" className="text-[13px] font-bold px-4 py-2 rounded-lg bg-black/5 text-[var(--ink-secondary)] hover:text-[var(--ink)]">💼 נהל צנרת</Link>}
          <DigestButton templateKey={key} />
        </div>
      </div>

      {bundle && (
        <div className="flex flex-wrap gap-2 mb-5">
          {bundle.dashboards.map((d) => {
            const t = templateByKey(d);
            const active = d === key;
            return (
              <Link key={d} href={`/dashboard/${d}?vertical=${bundle.key}`}
                className={`text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${active ? 'bg-emerald-600 text-white' : 'bg-black/5 text-[var(--ink-secondary)] hover:text-[var(--ink)]'}`}>
                {t?.name ?? d}
              </Link>
            );
          })}
        </div>
      )}

      <DashboardView widgets={widgets} dataById={dataById} persisted={persisted} department={key} />
    </main>
  );
}
