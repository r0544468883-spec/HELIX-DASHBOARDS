'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { templateByKey } from '@/lib/templates';
import type { WidgetLayout } from '@/lib/types';

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export async function currentWorkspace(supabase: SupabaseServer, userId: string): Promise<string | null> {
  const { data: mem } = await supabase
    .from('memberships').select('workspace_id').eq('user_id', userId).limit(1).maybeSingle();
  return (mem?.workspace_id as string) ?? null;
}

// Create the workspace on first use (with the chosen vertical), via SECURITY DEFINER RPC.
export async function ensureWorkspace(vertical?: string): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };
  const existing = await currentWorkspace(supabase, user.id);
  if (existing) return { id: existing };
  const { data, error } = await supabase.rpc('create_workspace', { ws_name: 'העסק שלי', ws_vertical: vertical ?? null });
  if (error) return { error: error.message };
  return { id: data as string };
}

// Materialize a department template into real dashboards + dashboard_widgets rows
// (idempotent: returns the existing dashboard if already created for this dept).
export async function instantiateTemplate(department: string): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };
  const ws = await currentWorkspace(supabase, user.id);
  if (!ws) return { error: 'no_workspace' };
  const tpl = templateByKey(department);
  if (!tpl) return { error: 'no_template' };

  const { data: existing } = await supabase
    .from('dashboards').select('id').eq('workspace_id', ws).eq('department', department).maybeSingle();
  if (existing) return { id: existing.id as string };

  const { data: dash, error: dErr } = await supabase
    .from('dashboards').insert({ workspace_id: ws, name: tpl.name, department, source: 'template' })
    .select('id').single();
  if (dErr) return { error: dErr.message };

  const rows = tpl.widgets.map((w) => ({
    dashboard_id: dash!.id, widget_type: w.widget_type, title: w.title, metric: w.metric,
    config: w.config ?? {}, layout: w.layout,
  }));
  const { error: wErr } = await supabase.from('dashboard_widgets').insert(rows);
  if (wErr) return { error: wErr.message };

  revalidatePath(`/dashboard/${department}`);
  return { id: dash!.id as string };
}

export async function saveLayout(widgetId: string, layout: WidgetLayout): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('dashboard_widgets').update({ layout }).eq('id', widgetId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function removeWidget(widgetId: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('dashboard_widgets').delete().eq('id', widgetId);
  if (error) return { error: error.message };
  return { ok: true };
}
