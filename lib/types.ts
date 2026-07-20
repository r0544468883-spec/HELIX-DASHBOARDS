// Core types for HELIX DASHBOARDS.

export type ChartKind = 'kpi' | 'line' | 'bar' | 'table' | 'gauge' | 'funnel';

export type WidgetLayout = { x: number; y: number; w: number; h: number };

export type WidgetConfig = {
  format?: 'number' | 'currency' | 'percent';
  target?: number; // for gauge
  color?: string;
  dims?: Record<string, string>; // metric_points.dims filter
};

export type WidgetDef = {
  id: string;
  widget_type: ChartKind;
  title: string;
  metric: string;
  config?: WidgetConfig;
  layout: WidgetLayout;
};

// A datum the renderer consumes (already read from metric_points / cache).
export type Series = { label: string; value: number }[];

export type WidgetData =
  | { kind: 'kpi'; value: number; delta?: number }
  | { kind: 'series'; series: Series }
  | { kind: 'table'; rows: Record<string, string | number>[] }
  | { kind: 'gauge'; value: number; target: number }
  | { kind: 'funnel'; steps: Series };

// A department template = an ordered set of widget defs (no ids yet).
export type TemplateWidget = Omit<WidgetDef, 'id'>;
export type DepartmentTemplate = {
  key: string;
  department: string;
  name: string;
  widgets: TemplateWidget[];
};

// A vertical bundle = the dashboards a business type gets.
export type Vertical = {
  key: string;
  emoji: string;
  name: string;
  dashboards: string[]; // department template keys
  signatureKpis: string[];
};
