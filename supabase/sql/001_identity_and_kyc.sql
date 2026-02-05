create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type public.verification_status as enum (
      'not_started',
      'pending',
      'approved',
      'rejected'
    );
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  telegram_username text,
  telegram_first_name text,
  telegram_last_name text,
  telegram_photo_url text,
  sumsub_applicant_id text unique,
  verification_status public.verification_status not null default 'not_started',
  verification_completed boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_verification_completed_consistency check (
    verification_completed = (verification_status in ('approved', 'rejected'))
  ),
  constraint users_verified_at_only_when_approved check (
    (verification_status = 'approved') = (verified_at is not null)
  )
);

create index if not exists users_verification_status_idx
  on public.users (verification_status);

create index if not exists users_sumsub_applicant_id_idx
  on public.users (sumsub_applicant_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create or replace function public.request_telegram_id()
returns bigint
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'telegram_id', '')::bigint;
$$;

alter table public.users enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own
on public.users
for select
using (telegram_id = public.request_telegram_id());

create table if not exists public.telegram_initdata_replays (
  telegram_id bigint not null,
  init_data_hash text not null,
  auth_date bigint not null,
  used_at timestamptz not null default now(),
  primary key (telegram_id, init_data_hash)
);

create index if not exists telegram_initdata_replays_used_at_idx
  on public.telegram_initdata_replays (used_at desc);

alter table public.telegram_initdata_replays enable row level security;

create table if not exists public.sumsub_webhook_events (
  id bigserial primary key,
  event_hash text not null unique,
  applicant_id text,
  external_user_id bigint,
  received_at timestamptz not null default now(),
  payload jsonb not null
);

create index if not exists sumsub_webhook_events_received_at_idx
  on public.sumsub_webhook_events (received_at desc);

create index if not exists sumsub_webhook_events_external_user_id_idx
  on public.sumsub_webhook_events (external_user_id);

alter table public.sumsub_webhook_events enable row level security;

