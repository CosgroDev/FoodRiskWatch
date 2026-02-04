-- FoodRisk Watch initial schema

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'pending' check (status in ('pending','active','unsubscribed')),
  created_at timestamptz not null default now()
);

create table if not exists email_tokens (
  token text primary key,
  user_id uuid references users(id) on delete cascade,
  purpose text not null check (purpose in ('verify','manage')),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  tier text not null default 'free',
  frequency text not null default 'weekly' check (frequency in ('weekly','daily','instant')),
  timezone text not null default 'Europe/London',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists subscriptions_user_id_idx on subscriptions(user_id);

create table if not exists filters (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists filters_subscription_id_idx on filters(subscription_id);

create table if not exists filter_rules (
  id uuid primary key default gen_random_uuid(),
  filter_id uuid references filters(id) on delete cascade,
  rule_type text not null check (rule_type in ('category','hazard','country','text')),
  rule_value text not null,
  created_at timestamptz not null default now()
);
create index if not exists filter_rules_filter_id_idx on filter_rules(filter_id);

create table if not exists alerts_raw (
  id uuid primary key default gen_random_uuid(),
  source_id text unique not null,
  payload_json jsonb not null,
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);
create unique index if not exists alerts_raw_source_id_idx on alerts_raw(source_id);

create table if not exists alerts_fact (
  id uuid primary key default gen_random_uuid(),
  raw_id uuid references alerts_raw(id) on delete cascade,
  hazard text,
  product_category text,
  product_text text,
  origin_country text,
  notifying_country text,
  alert_date timestamptz,
  link text
);
create index if not exists alerts_fact_raw_id_idx on alerts_fact(raw_id);
create index if not exists alerts_fact_hazard_idx on alerts_fact(hazard);
create index if not exists alerts_fact_product_category_idx on alerts_fact(product_category);
create index if not exists alerts_fact_origin_country_idx on alerts_fact(origin_country);
create index if not exists alerts_fact_alert_date_idx on alerts_fact(alert_date);

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions(id) on delete cascade,
  sent_at timestamptz,
  delivery_type text check (delivery_type in ('digest','instant')),
  status text,
  created_at timestamptz not null default now()
);
create index if not exists deliveries_subscription_id_idx on deliveries(subscription_id);

create table if not exists delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid references deliveries(id) on delete cascade,
  alerts_fact_id uuid references alerts_fact(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(delivery_id, alerts_fact_id)
);

-- Row Level Security
alter table users enable row level security;
alter table subscriptions enable row level security;
alter table filters enable row level security;
alter table filter_rules enable row level security;
alter table deliveries enable row level security;
alter table delivery_items enable row level security;

-- Users can see themselves
drop policy if exists users_self_select on users;
create policy users_self_select on users
  for select using (auth.uid() = id);
drop policy if exists users_self_update on users;
create policy users_self_update on users
  for update using (auth.uid() = id);

-- Subscriptions linked to user
drop policy if exists subscriptions_owner_select on subscriptions;
create policy subscriptions_owner_select on subscriptions
  for select using (auth.uid() = user_id);
drop policy if exists subscriptions_owner_update on subscriptions;
create policy subscriptions_owner_update on subscriptions
  for update using (auth.uid() = user_id);
drop policy if exists subscriptions_owner_insert on subscriptions;
create policy subscriptions_owner_insert on subscriptions
  for insert with check (auth.uid() = user_id);

-- Filters and rules via subscription ownership
drop policy if exists filters_owner_select on filters;
create policy filters_owner_select on filters
  for select using (
    exists(select 1 from subscriptions s where s.id = subscription_id and s.user_id = auth.uid())
  );
drop policy if exists filters_owner_update on filters;
create policy filters_owner_update on filters
  for update using (
    exists(select 1 from subscriptions s where s.id = subscription_id and s.user_id = auth.uid())
  );
drop policy if exists filters_owner_insert on filters;
create policy filters_owner_insert on filters
  for insert with check (
    exists(select 1 from subscriptions s where s.id = subscription_id and s.user_id = auth.uid())
  );

drop policy if exists filter_rules_owner_all on filter_rules;
create policy filter_rules_owner_all on filter_rules
  for all using (
    exists(select 1 from filters f join subscriptions s on f.subscription_id = s.id where f.id = filter_id and s.user_id = auth.uid())
  ) with check (
    exists(select 1 from filters f join subscriptions s on f.subscription_id = s.id where f.id = filter_id and s.user_id = auth.uid())
  );

-- Deliveries
drop policy if exists deliveries_owner_select on deliveries;
create policy deliveries_owner_select on deliveries
  for select using (
    exists(select 1 from subscriptions s where s.id = subscription_id and s.user_id = auth.uid())
  );
drop policy if exists deliveries_owner_insert on deliveries;
create policy deliveries_owner_insert on deliveries
  for insert with check (
    exists(select 1 from subscriptions s where s.id = subscription_id and s.user_id = auth.uid())
  );
drop policy if exists delivery_items_owner_all on delivery_items;
create policy delivery_items_owner_all on delivery_items
  for all using (
    exists(select 1 from deliveries d join subscriptions s on d.subscription_id = s.id where d.id = delivery_id and s.user_id = auth.uid())
  ) with check (
    exists(select 1 from deliveries d join subscriptions s on d.subscription_id = s.id where d.id = delivery_id and s.user_id = auth.uid())
  );

-- Service role bypasses RLS automatically when using service key.
