'use client';

import { useState } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { useMemo, useRef, useEffect } from 'react';
import type { WidgetDef, WidgetData } from '@/lib/types';
import WidgetCard from './widgets/WidgetCard';

// The drag-drop dashboard canvas. Renders widgets on a resizable grid; in edit
// mode the user drags/resizes/removes. onLayoutChange persists positions.
export default function DashboardCanvas({
  widgets, dataById, editable = true, onLayoutChange, onRemove,
}: {
  widgets: WidgetDef[];
  dataById: Record<string, WidgetData>;
  editable?: boolean;
  onLayoutChange?: (layout: Layout[]) => void;
  onRemove?: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1120);

  // Measure container so the grid is responsive without extra deps.
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout: Layout[] = useMemo(
    () => widgets.map((w) => ({ i: w.id, x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h, minW: 2, minH: 3 })),
    [widgets]
  );

  return (
    <div ref={ref}>
      {editable && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setEditing((e) => !e)}
            className={`text-[13px] font-bold px-4 py-2 rounded-lg transition-colors ${editing ? 'bg-emerald-600 text-white' : 'bg-black/5 text-[var(--ink-secondary)] hover:text-[var(--ink)]'}`}
          >
            {editing ? '✓ סיום עריכה' : '✎ ערוך דשבורד'}
          </button>
        </div>
      )}
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={64}
        width={width}
        isDraggable={editing}
        isResizable={editing}
        draggableHandle=".drag-handle"
        onLayoutChange={(l) => editing && onLayoutChange?.(l)}
        margin={[16, 16]}
      >
        {widgets.map((w) => (
          <div key={w.id}>
            <WidgetCard
              title={w.title}
              data={dataById[w.id]}
              config={w.config}
              editing={editing}
              onRemove={onRemove ? () => onRemove(w.id) : undefined}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
