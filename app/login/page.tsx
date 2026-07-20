'use client';

import { useState } from 'react';
import { signIn } from '@/app/actions-auth';

export default function LoginPage() {
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function action(formData: FormData) {
    setBusy(true); setErr(null);
    const res = await signIn(formData);
    setBusy(false);
    if ('error' in res && res.error) return setErr('שגיאה: ' + res.error);
    setSent(true);
  }

  return (
    <main className="max-w-[420px] mx-auto px-5 py-24">
      <div className="mb-1 text-[13px] font-bold text-emerald-600">HELIX DASHBOARDS</div>
      <h1 className="text-[28px] font-black tracking-tight mb-4">התחברות</h1>
      {sent ? (
        <p className="text-[15px] text-[var(--ink-secondary)]">שלחנו לך קישור התחברות למייל. פתח אותו כדי להיכנס.</p>
      ) : (
        <form action={action} className="space-y-3">
          <input name="email" type="email" dir="ltr" placeholder="email@example.com"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[15px] outline-none focus:border-emerald-500" />
          <button disabled={busy} className="w-full rounded-xl bg-emerald-600 text-white px-6 py-3 text-[15px] font-bold disabled:opacity-50">
            {busy ? 'שולח…' : 'שלח קישור התחברות'}
          </button>
          {err && <p className="text-[14px] text-red-600">{err}</p>}
        </form>
      )}
    </main>
  );
}
