'use client';

import { useState } from 'react';

// Previews the AI (Ollama/Claude) Hebrew digest for this dashboard — the same text
// the bot delivers to WhatsApp/Telegram/email.
export default function DigestButton({ templateKey }: { templateKey: string }) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ template: templateKey }),
      });
      const json = await res.json();
      setText(json.text || 'לא הוגדר מנוע (Ollama/Claude) — הצגת נתונים גולמיים.');
    } catch {
      setText('שגיאה בהפקת הסיכום.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button onClick={run} disabled={busy}
        className="text-[13px] font-bold px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
        {busy ? 'מפיק…' : '✨ סיכום AI'}
      </button>
      {text && (
        <div className="absolute end-0 mt-2 w-[340px] z-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg text-[13px] whitespace-pre-wrap">
          <button onClick={() => setText(null)} className="absolute top-2 start-2 text-[var(--ink-secondary)] hover:text-red-500" aria-label="סגור">×</button>
          {text}
        </div>
      )}
    </div>
  );
}
