'use client';

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  RadialBarChart, RadialBar, FunnelChart, Funnel, Cell, LabelList,
} from 'recharts';
import type { WidgetData, WidgetConfig } from '@/lib/types';
import { formatValue, BRAND, PALETTE } from '@/lib/format';

// Renders one widget's body from already-fetched WidgetData. Pure presentational.
export default function WidgetRenderer({ data, config }: { data: WidgetData; config?: WidgetConfig }) {
  const fmt = config?.format;
  const color = config?.color || BRAND;

  if (data.kind === 'kpi') {
    const up = (data.delta ?? 0) >= 0;
    return (
      <div className="flex flex-col justify-center h-full">
        <div className="text-[32px] font-black leading-none" style={{ color }}>{formatValue(data.value, fmt)}</div>
        {data.delta !== undefined && (
          <div className={`mt-1 text-[13px] font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? '▲' : '▼'} {formatValue(Math.abs(data.delta), 'percent')}
          </div>
        )}
      </div>
    );
  }

  if (data.kind === 'series') {
    const Chart = config?.dims?.chart === 'bar' ? BarChart : LineChart;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--ink-secondary)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--ink-secondary)' }} tickLine={false} axisLine={false} width={44} />
          <Tooltip formatter={(v: number) => formatValue(v, fmt)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          {Chart === BarChart
            ? <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            : <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} />}
        </Chart>
      </ResponsiveContainer>
    );
  }

  if (data.kind === 'gauge') {
    const pct = Math.min(100, Math.round((data.value / (data.target || 1)) * 100));
    return (
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: pct, fill: color }]} startAngle={210} endAngle={-30}>
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--border)' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[24px] font-black" style={{ color }}>{pct}%</div>
          <div className="text-[11px] text-[var(--ink-secondary)]">מתוך יעד {formatValue(data.target, fmt)}</div>
        </div>
      </div>
    );
  }

  if (data.kind === 'funnel') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip formatter={(v: number) => formatValue(v, fmt)} />
          <Funnel dataKey="value" data={data.steps} isAnimationActive>
            {data.steps.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            <LabelList position="right" dataKey="label" fontSize={12} fill="var(--ink)" />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    );
  }

  if (data.kind === 'table') {
    const cols = data.rows[0] ? Object.keys(data.rows[0]) : [];
    return (
      <div className="overflow-auto h-full">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[var(--ink-secondary)] text-right border-b border-[var(--border)]">
              {cols.map((c) => <th key={c} className="py-1.5 font-semibold">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i} className="border-b border-[var(--border)]/50">
                {cols.map((c) => <td key={c} className="py-1.5">{typeof r[c] === 'number' ? formatValue(r[c] as number, fmt) : r[c]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
