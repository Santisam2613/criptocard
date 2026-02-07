create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.config (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.config enable row level security;

drop trigger if exists config_set_updated_at on public.config;
create trigger config_set_updated_at
before update on public.config
for each row execute function public.set_updated_at();
