'use server';

import { createClient } from '@/lib/supabase/server';

// Magic-link sign in. Supabase emails a login link; the callback route completes it.
export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email.includes('@')) return { error: 'invalid_email' };
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${site}/auth/callback` },
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
