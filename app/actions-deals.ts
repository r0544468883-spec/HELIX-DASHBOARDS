'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { currentWorkspace } from './actions-dashboards';
import { computeSalesMetrics } from '@/lib/sales';
import { upsertMetrics } from '@/lib/connectors/upsert';

async function recompute(supabase: Awaited<ReturnType<typeof createClient>>, ws: string) {
  const points = await computeSalesMetrics(supabase, ws);
  await upsertMetrics(supabase, ws, points);
}

export async function addDeal(input: { title: string; company?: string; value?: number; stage?: string }): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };
  const ws = await currentWorkspace(supabase, user.id);
  if (!ws) return { error: 'no_workspace' };
  if (!input.title.trim()) return { error: 'title_required' };

  const { error } = await supabase.from('deals').insert({
    workspace_id: ws, title: input.title.trim(), company: input.company ?? null,
    value: input.value ?? 0, stage: input.stage ?? 'new',
  });
  if (error) return { error: error.message };
  await recompute(supabase, ws);
  revalidatePath('/deals');
  revalidatePath('/dashboard/sales');
  return { ok: true };
}

export async function setDealStage(id: string, stage: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };
  const ws = await currentWorkspace(supabase, user.id);
  if (!ws) return { error: 'no_workspace' };

  const closed = stage === 'won' || stage === 'lost';
  const { error } = await supabase.from('deals').update({ stage, closed_at: closed ? new Date().toISOString() : null }).eq('id', id);
  if (error) return { error: error.message };
  await recompute(supabase, ws);
  revalidatePath('/deals');
  revalidatePath('/dashboard/sales');
  return { ok: true };
}
