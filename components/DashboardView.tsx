'use client';

import { useState } from 'react';
import type { Layout } from 'react-grid-layout';
import type { WidgetDef, WidgetData } from '@/lib/types';
import DashboardCanvas from './DashboardCanvas';

// Client wrapper holding the editable widget list + layout state. In a full build
// onLayoutChange/onRemove persist to dashboard_widgets via a server action.
export default function DashboardView({
  widgets: initial, dataById,
}: {
  widgets: WidgetDef[];
  dataById: Record<string, WidgetData>;
}) {
  const [widgets, setWidgets] = useState<WidgetDef[]>(initial);

  function onLayoutChange(layout: Layout[]) {
    setWidgets((ws) => ws.map((w) => {
      const l = layout.find((x) => x.i === w.id);
      return l ? { ...w, layout: { x: l.x, y: l.y, w: l.w, h: l.h } } : w;
    }));
    // TODO(persist): save to dashboard_widgets.layout via server action.
  }

  function onRemove(id: string) {
    setWidgets((ws) => ws.filter((w) => w.id !== id));
  }

  return (
    <DashboardCanvas
      widgets={widgets}
      dataById={dataById}
      onLayoutChange={onLayoutChange}
      onRemove={onRemove}
    />
  );
}
