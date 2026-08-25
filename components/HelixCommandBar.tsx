'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommandPalette, type CommandItem } from '@/lib/motion';
import '@/lib/motion/tokens.css';

// Product brand accent — HELIX DASHBOARDS emerald (--brand in app/globals.css).
const ACCENT = '#059669';

/**
 * App-wide ⌘K / Ctrl+K command palette for HELIX DASHBOARDS.
 * Additive, non-visual until invoked — mounted once in the root layout.
 */
export default function HelixCommandBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const go = (path: string) => () => router.push(path);

  const items: CommandItem[] = [
    { id: 'home', title: 'דשבורדים', subtitle: 'בית', keywords: 'home dashboards helix', run: go('/') },
    { id: 'connect', title: 'חיבורים', subtitle: 'מקורות נתונים', keywords: 'connect sources integrations', run: go('/connect') },
    { id: 'digest', title: 'סיכומים', subtitle: 'סיכומים אוטומטיים ובוט', keywords: 'digest summary bot', run: go('/digest') },
    { id: 'deals', title: 'צנרת מכירות', subtitle: 'ניהול עסקאות', keywords: 'deals pipeline sales', run: go('/deals') },
    { id: 'templates', title: 'תבניות WhatsApp', subtitle: 'ניהול תבניות', keywords: 'templates whatsapp messages', run: go('/templates') },
    { id: 'settings', title: 'מתג אוטונומיה', subtitle: 'הגדרות', keywords: 'settings autonomy', run: go('/settings') },
    { id: 'login', title: 'התחברות', subtitle: 'כניסה לחשבון', keywords: 'login auth sign in', run: go('/login') },
  ];

  return (
    <div dir="rtl" style={{ ['--hm-accent' as any]: ACCENT }}>
      <CommandPalette
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        items={items}
        hotkey
        placeholder="חיפוש ניווט… (⌘K / Ctrl+K)"
      />
    </div>
  );
}
