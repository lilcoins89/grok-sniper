-- Grok Sniper initial schema. Apply through Supabase migrations.
create extension if not exists pgcrypto;

create table if not exists public.risk_profiles (
  id uuid primary key default gen_random_uuid(), version integer not null, mode text not null check (mode = 'PAPER'), max_position_sol numeric not null, max_concurrent_positions integer not null, max_total_exposure_sol numeric not null, max_daily_loss_sol numeric not null, max_slippage_pct numeric not null, min_liquidity_sol numeric not null, max_price_impact_pct numeric not null, max_top10_concentration_pct numeric not null, emergency_stop boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.tokens (
  mint text primary key, symbol text, name text, venue text not null, discovered_at timestamptz not null, last_updated_at timestamptz, data_state text not null, provenance text[] not null default '{}', liquidity_sol numeric, market_cap_usd numeric, holder_count integer, top10_concentration_pct numeric, strategy_score numeric, risk_score numeric, eligibility text not null, rejection_reasons text[] not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.token_events (
  event_id text primary key, mint text not null references public.tokens(mint) on delete cascade, observed_at timestamptz not null, provider text not null, payload jsonb not null default '{}'::jsonb
);
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(), agent text not null, status text not null, timeout_ms integer not null, retry_count integer not null default 0, input jsonb not null default '{}'::jsonb, output jsonb, error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(), mint text not null references public.tokens(mint) on delete cascade, agent_task_id uuid references public.agent_tasks(id), snapshot jsonb not null, decision text not null, evidence jsonb not null default '[]'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), idempotency_key text unique not null, mint text not null references public.tokens(mint), side text not null check (side in ('BUY','SELL')), state text not null, requested_sol numeric not null, filled_sol numeric not null default 0, average_price_usd numeric, signature text, mode text not null check (mode = 'PAPER'), reject_reasons text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.fills (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, filled_sol numeric not null, price_usd numeric not null, fee_sol numeric not null default 0, observed_at timestamptz not null default now()
);
create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(), mint text not null references public.tokens(mint), side text not null, quantity_sol numeric not null, entry_price_usd numeric not null, mark_price_usd numeric, realized_pnl_sol numeric not null default 0, status text not null default 'OPEN', opened_at timestamptz not null default now(), closed_at timestamptz
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), category text not null, action text not null, outcome text not null, detail text not null, actor_id uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.system_state (
  key text primary key, value jsonb not null, updated_at timestamptz not null default now()
);

alter table public.risk_profiles enable row level security;
alter table public.tokens enable row level security;
alter table public.token_events enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.analyses enable row level security;
alter table public.orders enable row level security;
alter table public.fills enable row level security;
alter table public.positions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_state enable row level security;

create policy "authenticated users can read paper data" on public.tokens for select to authenticated using (true);
create policy "authenticated users can read own-visible paper orders" on public.orders for select to authenticated using (true);
create policy "authenticated users can read audit logs" on public.audit_logs for select to authenticated using (true);
create policy "authenticated users can read paper risk profiles" on public.risk_profiles for select to authenticated using (mode = 'PAPER');

create index if not exists token_events_mint_observed_idx on public.token_events(mint, observed_at desc);
create index if not exists orders_state_updated_idx on public.orders(state, updated_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
