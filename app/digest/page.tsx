'use client';

import { useState } from 'react';
import { subscribeDigest, linkTelegram } from '@/app/actions-digest';

const DEPARTMENTS = [
  ['executive', 'הנהלה'], ['marketing', 'שיווק'], ['sales', 'מכירות'], ['finance', 'פיננסים'],
  ['saas', 'SaaS'], ['product', 'מוצר'], ['ecommerce', 'חנות'], ['support', 'שירות'],
];
const CHANNELS = [['telegram', 'טלגרם'], ['whatsapp', 'וואטסאפ'], ['email', 'מייל']] as const;

// Digest settings — schedule a daily dashboard summary to a channel, and link a
// Telegram chat so the bot answers with real data.
export default function DigestPage() {
  const [dept, setDept] = useState('executive');
  const [channel, setChannel] = useState<'telegram' | 'whatsapp' | 'email'>('telegram');
  const [target, setTarget] = useState('');
  const [hour, setHour] = useState(5);
  const [chatId, setChatId] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function subscribe() {
    const res = await subscribeDigest({ department: dept, channel, target, hour_utc: hour });
    setMsg('error' in res && res.error ? 'שגיאה: ' + res.error : '✓ נרשמת. הסיכום יישלח מדי יום.');
  }
  async function link() {
    const res = await linkTelegram(chatId);
    setMsg('error' in res && res.error ? 'שגיאה: ' + res.error : '✓ הצ׳אט חובר — הבוט יחזיר נתונים אמיתיים.');
  }

  const inp = 'rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none focus:border-emerald-500';

  return (
    <main className="max-w-[640px] mx-auto px-5 md:px-8 py-10">
      <div className="mb-1 text-[13px] font-bold text-emerald-600">HELIX DASHBOARDS</div>
      <h1 className="text-[28px] font-black tracking-tight mb-6">סיכומים אוטומטיים ובוט</h1>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-4">
        <h2 className="text-[15px] font-bold mb-3">סיכום יומי לערוץ</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <select className={inp} value={dept} onChange={(e) => setDept(e.target.value)}>{DEPARTMENTS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
          <select className={inp} value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)}>{CHANNELS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
          <input className={inp + ' flex-1 min-w-[180px]'} dir="ltr" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="chat id / טלפon / מייל" />
          <input className={inp + ' w-[90px]'} type="number" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} title="שעה (UTC)" />
          <button onClick={subscribe} className="text-[13px] font-bold px-4 py-2 rounded-lg bg-emerald-600 text-white">הרשם</button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-[15px] font-bold mb-1">חיבור בוט טלגרם</h2>
        <p className="text-[12px] text-[var(--ink-secondary)] mb-3">שלח הודעה לבוט, קח את ה-chat id, והדבק כאן — כדי שהבוט יחזיר נתונים אמיתיים.</p>
        <div className="flex flex-wrap gap-2 items-center">
          <input className={inp + ' flex-1 min-w-[180px]'} dir="ltr" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="Telegram chat id" />
          <button onClick={link} className="text-[13px] font-bold px-4 py-2 rounded-lg bg-black text-white">חבר צ׳אט</button>
        </div>
      </div>
      {msg && <p className="mt-4 text-[14px]">{msg}</p>}
    </main>
  );
}
