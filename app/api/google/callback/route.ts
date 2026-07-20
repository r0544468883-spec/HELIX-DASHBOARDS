import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCode } from '@/lib/google-oauth';
import { createClient } from '@/lib/supabase/server';

// Google OAuth callback — store tokens in httpOnly cookies and record/So upsert a
// 'ga4' connection row for the current workspace.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.redirect(`${origin}/connect?error=no_code`);

  try {
    const token = await exchangeCode(code);
    const jar = await cookies();
    jar.set('g_token', token.access_token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: token.expires_in });
    if (token.refresh_token) jar.set('g_refresh', token.refresh_token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 180 });

    // Mark the connection as connected for this workspace (if signed in).
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: mem } = await supabase.from('memberships').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle();
      const ws = mem?.workspace_id as string | undefined;
      if (ws) {
        // Persist the refresh token in config so the cron sync can run headless.
        // (MVP: see security note in lib/connectors/types.ts.)
        const cfg = token.refresh_token ? { refresh_token: token.refresh_token } : {};
        const { data: existing } = await supabase.from('connections').select('id, config').eq('workspace_id', ws).eq('provider', 'ga4').maybeSingle();
        if (existing) await supabase.from('connections').update({ status: 'connected', config: { ...(existing.config ?? {}), ...cfg } }).eq('id', existing.id);
        else await supabase.from('connections').insert({ workspace_id: ws, provider: 'ga4', label: 'Google Analytics 4', status: 'connected', config: cfg });
      }
    }
    return NextResponse.redirect(`${origin}/connect?connected=ga4`);
  } catch (e) {
    return NextResponse.redirect(`${origin}/connect?error=${encodeURIComponent((e as Error).message)}`);
  }
}
