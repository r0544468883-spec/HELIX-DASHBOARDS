'use client';

import type { WidgetData, WidgetConfig } from '@/lib/types';
import WidgetRenderer from './WidgetRenderer';

// Card chrome around a widget body. `onRemove` shows an X in edit mode.
export default function WidgetCard({
  title, data, config, editing, onRemove,
}: {
  title: string;
  data: WidgetData;
  config?: WidgetConfig;
  editing?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className="h-full flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="text-[13px] font-bold text-[var(--ink-secondary)] truncate drag-handle cursor-move">{title}</div>
        {editing && onRemove && (
          <button onClick={onRemove} className="text-[var(--ink-secondary)] hover:text-red-500 text-[16px] leading-none shrink-0" aria-label="הסר widget">×</button>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <WidgetRenderer data={data} config={config} />
      </div>
    </div>
  );
}
