'use server';

import { createClient } from '@/lib/supabase/server';
import { currentWorkspace } from './actions-dashboards';

// Create a scheduled digest subscription (dashboard → channel → target, daily).
export async function subscribeDigest(input: {
  department: string; channel: 'telegram' | 'whatsapp' | 'email'; target: string; hour_utc?: number;
}): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };
  const ws = await currentWorkspace(supabase, user.id);
  if (!ws) return { error: 'no_workspace' };
  if (!input.target.trim()) return { error: 'target_required' };

  const { error } = await supabase.from('digest_subscriptions').insert({
    workspace_id: ws, department: input.department, channel: input.channel,
    target: input.target.trim(), hour_utc: input.hour_utc ?? 5, active: true,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

// Link a Telegram chat id to the workspace so the bot returns real data.
export async function linkTelegram(chatId: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };
  const ws = await currentWorkspace(supabase, user.id);
  if (!ws) return { error: 'no_workspace' };
  if (!chatId.trim()) return { error: 'chat_id_required' };

  const { error } = await supabase.from('bot_links').upsert({ chat_id: chatId.trim(), workspace_id: ws }, { onConflict: 'chat_id' });
  if (error) return { error: error.message };
  return { ok: true };
}
