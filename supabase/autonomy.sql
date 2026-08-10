-- HELIX Autonomy Switch — Dashboards install. See helix/PRODUCTS/AUTONOMY-SWITCH-SPEC.md.
-- Dashboards is the intended central context-graph hub; its switch will govern
-- cross-product action dispatch (dash.cross_act). Safe default: absent row => advisor.

create table if not exists autonomy_settings (
  workspace_id  uuid not null,
  feature_key   text not null,
  mode          text not null default 'advisor'
                check (mode in ('advisor','approve','autopilot')),
  risk_ack      boolean not null default false,
  daily_cap     int,
  updated_by    uuid,
  updated_at    timestamptz default now(),
  primary key (workspace_id, feature_key)
);

alter table autonomy_settings enable row level security;

do $$ begin
  create policy autonomy_member on autonomy_settings for all
    using (is_member(workspace_id));
exception when duplicate_object then null; end $$;
