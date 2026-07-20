'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Layout } from 'react-grid-layout';
import type { WidgetDef, WidgetData } from '@/lib/types';
import DashboardCanvas from './DashboardCanvas';
import { saveLayout, removeWidget, instantiateTemplate, ensureWorkspace } from '@/app/actions-dashboards';

// Client wrapper holding the editable widget list + layout state.
// When `persisted` (real DB dashboard) edits save to dashboard_widgets; otherwise
// a "save to my dashboards" button materializes the template first.
export default function DashboardView({
  widgets: initial, dataById, persisted, department,
}: {
  widgets: WidgetDef[];
  dataById: Record<string, WidgetData>;
  persisted: boolean;
  department: string;
}) {
  const router = useRouter();
  const [widgets, setWidgets] = useState<WidgetDef[]>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function onLayoutChange(layout: Layout[]) {
    setWidgets((ws) => ws.map((w) => {
      const l = layout.find((x) => x.i === w.id);
      if (!l) return w;
      const next = { x: l.x, y: l.y, w: l.w, h: l.h };
      if (persisted) void saveLayout(w.id, next); // fire-and-forget persist
      return { ...w, layout: next };
    }));
  }

  function onRemove(id: string) {
    setWidgets((ws) => ws.filter((w) => w.id !== id));
    if (persisted) void removeWidget(id);
  }

  async function saveToMyDashboards() {
    setSaving(true); setMsg(null);
    const ws = await ensureWorkspace();
    if ('error' in ws && ws.error) { setSaving(false); return setMsg(ws.error === 'unauthorized' ? 'צריך להתחבר קודם.' : 'שגיאה: ' + ws.error); }
    const res = await instantiateTemplate(department);
    setSaving(false);
    if ('error' in res && res.error) return setMsg('שגיאה: ' + res.error);
    router.refresh(); // reload as a persisted dashboard
  }

  return (
    <div>
      {!persisted && (
        <div className="flex items-center gap-3 mb-3">
          <button onClick={saveToMyDashboards} disabled={saving}
            className="text-[13px] font-bold px-4 py-2 rounded-lg bg-black/5 text-[var(--ink-secondary)] hover:text-[var(--ink)] disabled:opacity-50">
            {saving ? 'שומר…' : '💾 שמור לדשבורדים שלי (כדי לערוך ולשמור)'}
          </button>
          {msg && <span className="text-[13px] text-red-600">{msg}</span>}
        </div>
      )}
      <DashboardCanvas widgets={widgets} dataById={dataById} onLayoutChange={onLayoutChange} onRemove={onRemove} />
    </div>
  );
}
