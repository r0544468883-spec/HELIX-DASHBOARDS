-- HELIX DASHBOARDS — core schema. Widget-based, per-workspace, RLS.
-- Flow: connector → metric_points (metrics_cache) → widget reads cache.

-- ── Workspaces & membership ────────────────────────────────────────────
create table if not exists workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  vertical   text,                                   -- ecommerce | saas | accounting | agency | ...
  created_at timestamptz default now()
);

create table if not exists memberships (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  role         text default 'owner',
  primary key (workspace_id, user_id)
);

-- ── Connections (data sources per workspace) ───────────────────────────
create table if not exists connections (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  provider     text not null,                        -- ga4 | meta_ads | stripe | shopify | hubspot | greeninvoice | helix_rank | ...
  label        text,
  status       text default 'disconnected',          -- connected | disconnected | error
  config       jsonb default '{}'::jsonb,             -- ids, property ids (NO secrets — tokens in vault/edge env)
  created_at   timestamptz default now()
);

-- ── metrics_cache — the single source of truth widgets read from ───────
-- One row per (metric, dimension slice, day). Connectors normalize into this.
create table if not exists metric_points (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  source       text not null,                        -- ga4 | stripe | ...
  metric       text not null,                        -- sessions | roas | mrr | aov | tickets | ...
  dims         jsonb default '{}'::jsonb,             -- {campaign, channel, product, ...}
  ts           date not null,                        -- the day this value is for
  value        numeric not null,
  updated_at   timestamptz default now(),
  unique (workspace_id, source, metric, dims, ts)
);
create index if not exists idx_metric_points_lookup on metric_points(workspace_id, metric, ts desc);

-- ── widget_library — catalog of atomic widget types ───────────────────
create table if not exists widget_library (
  id          text primary key,                       -- kpi | line | bar | table | gauge | funnel
  name        text not null,
  chart_kind  text not null,                          -- kpi | line | bar | table | gauge | funnel
  description text
);

-- ── dashboards + their placed widgets ─────────────────────────────────
create table if not exists dashboards (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name         text not null,
  department   text,                                  -- marketing | sales | finance | ...
  source       text default 'template',               -- template | custom | ai
  is_default   boolean default false,
  created_at   timestamptz default now()
);

create table if not exists dashboard_widgets (
  id           uuid primary key default gen_random_uuid(),
  dashboard_id uuid references dashboards(id) on delete cascade,
  widget_type  text references widget_library(id),    -- kpi | line | ...
  title        text,
  metric       text,                                  -- which metric_points.metric to read
  config       jsonb default '{}'::jsonb,             -- dims filter, agg, format, color
  layout       jsonb default '{}'::jsonb,             -- {x,y,w,h} react-grid-layout
  created_at   timestamptz default now()
);

-- ── Seed the atomic widget catalog ────────────────────────────────────
insert into widget_library (id, name, chart_kind, description) values
  ('kpi',    'כרטיס KPI',   'kpi',    'מספר בודד + מגמה'),
  ('line',   'גרף קו',      'line',   'מגמה לאורך זמן'),
  ('bar',    'גרף עמודות',  'bar',    'השוואה בין קטגוריות'),
  ('table',  'טבלה',        'table',  'רשומות מפורטות'),
  ('gauge',  'מד',          'gauge',  'ערך מול יעד'),
  ('funnel', 'משפך',        'funnel', 'שלבי המרה')
on conflict (id) do nothing;

-- ── RLS ───────────────────────────────────────────────────────────────
alter table workspaces         enable row level security;
alter table memberships        enable row level security;
alter table connections        enable row level security;
alter table metric_points      enable row level security;
alter table dashboards         enable row level security;
alter table dashboard_widgets  enable row level security;

create or replace function is_member(ws uuid) returns boolean language sql security definer stable as $$
  select exists (select 1 from memberships m where m.workspace_id = ws and m.user_id = auth.uid());
$$;

do $$ begin
  create policy ws_member on workspaces for all using (is_member(id));
  create policy conn_member on connections for all using (is_member(workspace_id));
  create policy metric_member on metric_points for all using (is_member(workspace_id));
  create policy dash_member on dashboards for all using (is_member(workspace_id));
  create policy dw_member on dashboard_widgets for all using (
    exists (select 1 from dashboards d where d.id = dashboard_id and is_member(d.workspace_id))
  );
  create policy mem_self on memberships for all using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ── Digest subscriptions — scheduled push of a dashboard to a channel ──
create table if not exists digest_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  department   text not null,                        -- which dashboard
  channel      text not null,                        -- telegram | whatsapp | email
  target       text not null,                        -- chat id / phone / email
  hour_utc     int default 5,                        -- daily send hour (UTC)
  active       boolean default true,
  created_at   timestamptz default now()
);

-- ── Telegram bot links — map a chat to a workspace so the bot returns real data ──
create table if not exists bot_links (
  chat_id      text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  created_at   timestamptz default now()
);

-- ── Deals — native sales pipeline (atomic-crm pattern) → real Sales dashboard ──
create table if not exists deals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  title        text not null,
  company      text,
  value        numeric default 0,
  stage        text default 'new',                   -- new | qualified | proposal | won | lost
  owner        text,
  created_at   timestamptz default now(),
  closed_at    timestamptz
);
create index if not exists idx_deals_ws on deals(workspace_id, stage);

alter table digest_subscriptions enable row level security;
alter table bot_links            enable row level security;
alter table deals                enable row level security;
do $$ begin
  create policy digest_member on digest_subscriptions for all using (is_member(workspace_id));
  create policy botlink_member on bot_links for all using (is_member(workspace_id));
  create policy deals_member on deals for all using (is_member(workspace_id));
exception when duplicate_object then null; end $$;

-- Create a workspace + owner membership atomically (SECURITY DEFINER bypasses
-- the chicken-and-egg RLS on a brand-new workspace).
create or replace function create_workspace(ws_name text, ws_vertical text default null)
returns uuid language plpgsql security definer as $$
declare new_id uuid;
begin
  insert into workspaces (name, vertical) values (ws_name, ws_vertical) returning id into new_id;
  insert into memberships (workspace_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end $$;

-- widget_library is public read (catalog).
alter table widget_library enable row level security;
do $$ begin
  create policy wl_read on widget_library for select using (true);
exception when duplicate_object then null; end $$;
