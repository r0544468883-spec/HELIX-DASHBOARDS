import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DealsManager, { type Deal } from '@/components/DealsManager';

export const dynamic = 'force-dynamic';

// Native sales pipeline (atomic-crm pattern). Deals here feed the Sales dashboard
// KPIs (pipeline value / win rate / forecast) via computed metric_points.
export default async function DealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: mem } = await supabase.from('memberships').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle();

  let deals: Deal[] = [];
  if (mem?.workspace_id) {
    const { data } = await supabase
      .from('deals').select('id, title, company, value, stage').eq('workspace_id', mem.workspace_id).order('created_at', { ascending: false });
    deals = (data ?? []) as Deal[];
  }

  return (
    <main className="max-w-[1080px] mx-auto px-5 md:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/dashboard/sales" className="text-[12px] font-bold text-emerald-600">← דשבורד מכירות</Link>
          <h1 className="text-[28px] font-black tracking-tight">צנרת מכירות</h1>
        </div>
      </div>
      <DealsManager initial={deals} />
    </main>
  );
}
