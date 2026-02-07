
-- ==============================================================================
-- 2. WALLET Y BALANCES (Ledger-based System)
-- ==============================================================================

create table if not exists public.wallets (
  user_id uuid primary key references public.users(id) on delete restrict,
  usdt_balance numeric(20, 6) not null default 0,
  updated_at timestamptz not null default now(),
  constraint balance_non_negative check (usdt_balance >= 0)
);

-- Trigger para updated_at en wallets
create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

-- RLS: Solo lectura para el dueño (no updates directos permitidos por nadie excepto triggers)
alter table public.wallets enable row level security;

create policy wallets_select_own
on public.wallets for select
using (user_id in (select id from public.users where telegram_id = public.request_telegram_id()));

-- ==============================================================================
-- 3. TRANSACCIONES (LEDGER) - Inmutable
-- ==============================================================================

create type public.transaction_type as enum (
  'topup',
  'transfer',
  'withdraw',
  'referral_conversion',
  'stripe_payment',
  'diamond_conversion'
);

create type public.transaction_status as enum (
  'pending',
  'completed',
  'rejected'
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type public.transaction_type not null,
  user_id uuid not null references public.users(id) on delete restrict,
  counterparty_user_id uuid references public.users(id) on delete restrict,
  amount_usdt numeric(20, 6) not null, -- Puede ser negativo (débito) o positivo (crédito)
  original_currency text,
  original_amount numeric(20, 6),
  status public.transaction_status not null default 'pending',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  
  -- Constraints de integridad
  constraint transactions_amount_nonzero check (amount_usdt <> 0)
);

-- Índices para búsqueda rápida
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_created_at_idx on public.transactions (created_at desc);
create index if not exists transactions_type_idx on public.transactions (type);

-- RLS: Solo lectura de propias transacciones
alter table public.transactions enable row level security;

create policy transactions_select_own
on public.transactions for select
using (user_id in (select id from public.users where telegram_id = public.request_telegram_id()));

-- ==============================================================================
-- 4. TRIGGER DE CONSISTENCIA (Ledger -> Wallet)
-- ==============================================================================

create or replace function public.update_wallet_balance()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Solo procesar transacciones completadas
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    
    -- Upsert wallet (crear si no existe)
    insert into public.wallets (user_id, usdt_balance)
    values (new.user_id, 0)
    on conflict (user_id) do nothing;

    -- Actualizar balance atómicamente
    update public.wallets
    set usdt_balance = usdt_balance + new.amount_usdt
    where user_id = new.user_id;
    
    -- Validar que no quede negativo (redundante con check constraint pero buena práctica)
    if (select usdt_balance from public.wallets where user_id = new.user_id) < 0 then
      raise exception 'Fondos insuficientes para la transacción %', new.id;
    end if;

  end if;
  return new;
end;
$$;

create trigger transactions_update_wallet
after insert or update on public.transactions
for each row execute function public.update_wallet_balance();

-- Prohibir DELETE/UPDATE (Inmutabilidad parcial: solo status puede cambiar de pending a final)
create or replace function public.prevent_transaction_tampering()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'DELETE' then
    raise exception 'No se permite eliminar transacciones';
  elsif TG_OP = 'UPDATE' then
    if old.status = 'completed' or old.status = 'rejected' then
      raise exception 'No se puede modificar una transacción finalizada';
    end if;
    -- Solo permitir cambiar status y metadata
    if new.id != old.id or new.user_id != old.user_id or new.amount_usdt != old.amount_usdt or new.type != old.type then
      raise exception 'No se pueden modificar campos críticos del ledger';
    end if;
  end if;
  return new;
end;
$$;

create trigger transactions_immutable_check
before delete or update on public.transactions
for each row execute function public.prevent_transaction_tampering();

-- ==============================================================================
-- 7. TARJETAS
-- ==============================================================================

create type public.card_type as enum ('virtual', 'physical');
create type public.card_status as enum ('active', 'frozen', 'blocked');

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type public.card_type not null default 'virtual',
  status public.card_status not null default 'active',
  provider_card_id text unique, -- ID externo del proveedor (ej. Stripe/Marqeta)
  last_4 text,
  expiry_month int,
  expiry_year int,
  brand text default 'visa',
  currency text default 'USD',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger cards_set_updated_at
before update on public.cards
for each row execute function public.set_updated_at();

alter table public.cards enable row level security;

create policy cards_select_own
on public.cards for select
using (user_id in (select id from public.users where telegram_id = public.request_telegram_id()));

-- ==============================================================================
-- 8. SISTEMA DE REFERIDOS
-- ==============================================================================

create type public.referral_status as enum ('pending', 'eligible', 'claimed');

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id),
  referred_user_id uuid not null unique references public.users(id),
  status public.referral_status not null default 'pending',
  reward_amount_usdt numeric(20, 6) not null default 0,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger referrals_set_updated_at
before update on public.referrals
for each row execute function public.set_updated_at();

alter table public.referrals enable row level security;

create policy referrals_select_own
on public.referrals for select
using (referrer_user_id in (select id from public.users where telegram_id = public.request_telegram_id()));

-- ==============================================================================
-- 9. DIAMANTES (REWARDS)
-- ==============================================================================

create table if not exists public.diamonds_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  amount int not null, -- Enteros, puede ser negativo
  reason text not null, -- 'daily_login', 'referral', 'conversion'
  balance_after int not null, -- Snapshot para integridad
  created_at timestamptz not null default now()
);

create table if not exists public.diamonds_wallet (
  user_id uuid primary key references public.users(id) on delete restrict,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

-- Trigger para actualizar wallet de diamantes
create or replace function public.update_diamonds_balance()
returns trigger
language plpgsql
security definer
as $$
declare
  current_bal int;
begin
  insert into public.diamonds_wallet (user_id, balance) values (new.user_id, 0)
  on conflict (user_id) do nothing;
  
  update public.diamonds_wallet
  set balance = balance + new.amount, updated_at = now()
  where user_id = new.user_id
  returning balance into current_bal;
  
  -- Guardar snapshot en ledger
  new.balance_after := current_bal;
  
  if current_bal < 0 then
    raise exception 'Balance de diamantes insuficiente';
  end if;
  
  return new;
end;
$$;

create trigger diamonds_ledger_update_wallet
before insert on public.diamonds_ledger
for each row execute function public.update_diamonds_balance();

alter table public.diamonds_wallet enable row level security;
alter table public.diamonds_ledger enable row level security;

create policy diamonds_select_own
on public.diamonds_wallet for select
using (user_id in (select id from public.users where telegram_id = public.request_telegram_id()));

-- ==============================================================================
-- 10. CONFIGURACIÓN GLOBAL (Seed básico)
-- ==============================================================================

create table if not exists public.config (
  key text primary key,
  value text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.config (key, value) values
('diamond_to_usdt_rate', '0.01'), -- 1 diamante = 0.01 USDT
('referral_reward_usdt', '5.00'),
('min_withdrawal_usdt', '10.00')
on conflict (key) do nothing;

alter table public.config enable row level security;
create policy config_read_all on public.config for select using (true);
