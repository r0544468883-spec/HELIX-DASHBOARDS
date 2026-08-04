import type { WidgetDef, WidgetData } from './types';
import { renderFigurePng } from './nyyon';

// Pick the single most tell-able figure from a dashboard's widgets+data and
// render it to a PNG, so a digest can carry ONE chart image alongside its text.
// Priority: a real time-series (line/bar) > a funnel > headline KPIs as bars.
// Returns null when there isn't enough numeric data to make an honest chart —
// the digest then just goes out as text (never a fabricated chart).

const cap = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const label = (s: string, n: number) => cap(String(s ?? ''), n);

function unitFor(w: WidgetDef): string | undefined {
  if (w.config?.format === 'percent') return '%';
  if (w.config?.format === 'currency') return '₪';
  return undefined;
}

export async function digestFigurePng(
  widgets: WidgetDef[],
  dataById: Record<string, WidgetData>,
): Promise<{ png: Buffer; template: string } | null> {
  // 1) First real series → a time chart. ≥3 points reads as a line; 2 as columns.
  for (const w of widgets) {
    const d = dataById[w.id];
    if (d?.kind === 'series' && d.series.length >= 2) {
      const x = d.series.map((p) => label(p.label, 8));
      const values = d.series.map((p) => p.value);
      if (d.series.length >= 3) {
        return {
          template: 'chart_line',
          png: await renderFigurePng('chart_line', {
            fig_label: label(w.title, 42).toUpperCase(),
            x,
            series: [{ name: label(w.title, 16), values }],
            focus: label(w.title, 16),
            unit: unitFor(w),
          }),
        };
      }
      return {
        template: 'chart_column',
        png: await renderFigurePng('chart_column', {
          fig_label: label(w.title, 42).toUpperCase(),
          x,
          series: [{ name: label(w.title, 14), values }],
          unit: unitFor(w),
        }),
      };
    }
  }

  // 2) A funnel widget → the funnel diagram.
  for (const w of widgets) {
    const d = dataById[w.id];
    if (d?.kind === 'funnel' && d.steps.length >= 2) {
      return {
        template: 'funnel',
        png: await renderFigurePng('funnel', {
          fig_label: label(w.title, 42).toUpperCase(),
          steps: d.steps.slice(0, 6).map((s) => ({ label: label(s.label, 18), value: s.value })),
          unit: unitFor(w),
        }),
      };
    }
  }

  // 3) Headline KPIs/gauges as a bar chart — but only the largest COHERENT group
  //    (same number format), so we never put ₪ and % on one axis.
  type Item = { label: string; value: number; fmt: string };
  const items: Item[] = [];
  for (const w of widgets) {
    const d = dataById[w.id];
    if (d?.kind === 'kpi') items.push({ label: label(w.title, 22), value: d.value, fmt: w.config?.format ?? 'number' });
    else if (d?.kind === 'gauge') items.push({ label: label(w.title, 22), value: d.value, fmt: w.config?.format ?? 'number' });
  }
  if (items.length >= 2) {
    const byFmt = new Map<string, Item[]>();
    for (const it of items) (byFmt.get(it.fmt) ?? byFmt.set(it.fmt, []).get(it.fmt)!).push(it);
    const group = [...byFmt.values()].sort((a, b) => b.length - a.length)[0];
    if (group.length >= 2) {
      const unit = group[0].fmt === 'percent' ? '%' : group[0].fmt === 'currency' ? '₪' : undefined;
      return {
        template: 'chart_bar',
        png: await renderFigurePng('chart_bar', {
          fig_label: 'סיכום מדדים'.toUpperCase(),
          items: group.slice(0, 8).map((it) => ({ label: it.label, value: it.value })),
          unit,
        }),
      };
    }
  }

  return null;
}
