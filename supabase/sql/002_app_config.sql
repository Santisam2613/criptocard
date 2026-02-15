
-- ==============================================================================
-- 2. WALLET Y BALANCES (Ledger-based System)
-- ==============================================================================

create table if not exists public.wallets (
  user_id uuid primary key references public.users(id) on delete restrict,
  usdt_balance numeric(20, 6) not null default 0,
  updated_at timestamptz not null default now(),
  constraint balance_non_negative check (usdt_balance >= 0)
);

create or replace function public.prevent_wallet_manual_write()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.allow_wallet_write', true) = '1' then
    if TG_OP = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  raise exception 'No se permite modificar wallets directamente. Use el ledger (transactions).';
end;
$$;

create trigger a_wallets_prevent_manual_write
before insert or update or delete on public.wallets
for each row execute function public.prevent_wallet_manual_write();

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
  'diamond_conversion',
  'card_purchase'
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
    perform set_config('app.allow_wallet_write', '1', true);

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

    perform set_config('app.allow_wallet_write', '0', true);
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
-- 5. TRANSFERENCIAS INTERNAS (RPC atómica)
-- ==============================================================================

create or replace function public.create_internal_transfer(
  p_sender_telegram_id bigint,
  p_recipient_telegram_id bigint,
  p_amount_usdt numeric(20, 6)
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_user_id uuid;
  recipient_user_id uuid;
  sender_balance numeric(20, 6);
  transfer_group_id uuid := gen_random_uuid();
  sender_name text;
  recipient_name text;
  recipient_status public.verification_status;
begin
  if p_amount_usdt is null or p_amount_usdt <= 0 then
    raise exception 'Monto inválido';
  end if;

  if p_sender_telegram_id is null or p_recipient_telegram_id is null then
    raise exception 'Usuario inválido';
  end if;

  if p_sender_telegram_id = p_recipient_telegram_id then
    raise exception 'No se permite transferir a uno mismo';
  end if;

  select id,
         coalesce(nullif(telegram_username, ''), nullif(telegram_first_name, ''), telegram_id::text)
    into sender_user_id, sender_name
  from public.users
  where telegram_id = p_sender_telegram_id
  limit 1;

  if sender_user_id is null then
    raise exception 'Remitente no encontrado';
  end if;

  select id,
         coalesce(nullif(telegram_username, ''), nullif(telegram_first_name, ''), telegram_id::text),
         verification_status
    into recipient_user_id, recipient_name, recipient_status
  from public.users
  where telegram_id = p_recipient_telegram_id
  limit 1;

  if recipient_user_id is null then
    raise exception 'Destinatario no encontrado';
  end if;

  if recipient_status != 'approved' then
    raise exception 'El destinatario debe estar verificado';
  end if;

  perform set_config('app.allow_wallet_write', '1', true);

  insert into public.wallets (user_id, usdt_balance)
  values (sender_user_id, 0)
  on conflict (user_id) do nothing;

  insert into public.wallets (user_id, usdt_balance)
  values (recipient_user_id, 0)
  on conflict (user_id) do nothing;

  select usdt_balance
    into sender_balance
  from public.wallets
  where user_id = sender_user_id;

  if sender_balance is null then
    sender_balance := 0;
  end if;

  if sender_balance < p_amount_usdt then
    raise exception 'Fondos insuficientes';
  end if;

  insert into public.transactions (
    type,
    user_id,
    counterparty_user_id,
    amount_usdt,
    status,
    metadata
  ) values (
    'transfer',
    sender_user_id,
    recipient_user_id,
    -p_amount_usdt,
    'completed',
    jsonb_build_object(
      'transfer_group_id', transfer_group_id,
      'direction', 'out',
      'counterparty_name', recipient_name,
      'description', format('Transferencia a %s', recipient_name)
    )
  );

  insert into public.transactions (
    type,
    user_id,
    counterparty_user_id,
    amount_usdt,
    status,
    metadata
  ) values (
    'transfer',
    recipient_user_id,
    sender_user_id,
    p_amount_usdt,
    'completed',
    jsonb_build_object(
      'transfer_group_id', transfer_group_id,
      'direction', 'in',
      'counterparty_name', sender_name,
      'description', format('Transferencia de %s', sender_name)
    )
  );

  return transfer_group_id;
end;
$$;

create or replace function public.create_withdraw_request(
  p_sender_telegram_id bigint,
  p_amount_usdt numeric(20, 6),
  p_address text,
  p_network text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_user_id uuid;
  sender_balance numeric(20, 6);
  request_id uuid := gen_random_uuid();
  sender_status public.verification_status;
begin
  if p_amount_usdt is null or p_amount_usdt <= 0 then
    raise exception 'Monto inválido';
  end if;

  if p_sender_telegram_id is null then
    raise exception 'Usuario inválido';
  end if;

  if p_address is null or btrim(p_address) = '' or p_network is null or btrim(p_network) = '' then
    raise exception 'Datos inválidos';
  end if;

  select id, verification_status
    into sender_user_id, sender_status
  from public.users
  where telegram_id = p_sender_telegram_id
  limit 1;

  if sender_user_id is null then
    raise exception 'Usuario no encontrado';
  end if;

  if sender_status != 'approved' then
    raise exception 'Cuenta no verificada';
  end if;

  perform set_config('app.allow_wallet_write', '1', true);

  insert into public.wallets (user_id, usdt_balance)
  values (sender_user_id, 0)
  on conflict (user_id) do nothing;

  select usdt_balance
    into sender_balance
  from public.wallets
  where user_id = sender_user_id;

  if sender_balance is null then
    sender_balance := 0;
  end if;

  if sender_balance < p_amount_usdt then
    raise exception 'Fondos insuficientes';
  end if;

  insert into public.transactions (
    id,
    type,
    user_id,
    amount_usdt,
    status,
    metadata
  ) values (
    request_id,
    'withdraw',
    sender_user_id,
    -p_amount_usdt,
    'pending',
    jsonb_build_object(
      'address', btrim(p_address),
      'network', btrim(p_network),
      'description', 'Retiro a wallet externa'
    )
  );

  return request_id;
end;
$$;

create or replace function public.create_topup(
  p_sender_telegram_id bigint,
  p_amount_usdt numeric(20, 6)
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_status public.verification_status;
  v_tx_id uuid := gen_random_uuid();
  v_min_topup numeric(20, 6);
begin
  if p_amount_usdt is null or p_amount_usdt <= 0 then
    raise exception 'Monto inválido';
  end if;

  select coalesce(nullif(value, '')::numeric(20, 6), 0::numeric(20, 6))
    into v_min_topup
  from public.config
  where key = 'min_topup_usdt'
  limit 1;

  if v_min_topup is null then
    v_min_topup := 0::numeric(20, 6);
  end if;

  if v_min_topup > 0 and p_amount_usdt < v_min_topup then
    raise exception 'El monto mínimo de recarga es % USDT', v_min_topup;
  end if;

  select id, verification_status
    into v_user_id, v_status
  from public.users
  where telegram_id = p_sender_telegram_id
  limit 1;

  if v_user_id is null then
    raise exception 'Usuario no encontrado';
  end if;

  if v_status != 'approved' then
    raise exception 'Cuenta no verificada';
  end if;

  insert into public.transactions (
    id,
    type,
    user_id,
    amount_usdt,
    status,
    metadata
  ) values (
    v_tx_id,
    'topup',
    v_user_id,
    p_amount_usdt,
    'completed',
    jsonb_build_object(
      'description', 'Recarga de saldo',
      'source', 'miniapp_topup'
    )
  );

  return v_tx_id;
end;
$$;

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

create or replace function public.purchase_virtual_card(
  p_buyer_telegram_id bigint
)
returns table (
  card_id uuid,
  transaction_id uuid,
  price_usdt numeric(20, 6),
  last_4 text,
  expiry_month int,
  expiry_year int,
  status public.card_status,
  brand text,
  cardholder_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_status public.verification_status;
  v_first_name text;
  v_last_name text;
  v_username text;
  v_price numeric(20, 6);
  v_balance numeric(20, 6);
  v_tx_id uuid := gen_random_uuid();
  v_card_id uuid := gen_random_uuid();
  v_last4 text;
  v_exp_month int;
  v_exp_year int;
  v_cardholder text;
begin
  select id,
         verification_status,
         telegram_first_name,
         telegram_last_name,
         telegram_username
    into v_user_id, v_status, v_first_name, v_last_name, v_username
  from public.users
  where telegram_id = p_buyer_telegram_id
  limit 1;

  if v_user_id is null then
    raise exception 'Usuario no encontrado';
  end if;

  if v_status != 'approved' then
    raise exception 'Cuenta no verificada';
  end if;

  if exists (
    select 1
    from public.cards c
    where c.user_id = v_user_id
      and c.type = 'virtual'::public.card_type
  ) then
    raise exception 'Ya tienes una tarjeta virtual';
  end if;

  select coalesce(nullif(value, '')::numeric(20, 6), 30::numeric(20, 6))
    into v_price
  from public.config
  where key = 'virtual_card_price_usdt'
  limit 1;

  if v_price is null or v_price <= 0 then
    v_price := 30::numeric(20, 6);
  end if;

  perform set_config('app.allow_wallet_write', '1', true);

  insert into public.wallets (user_id, usdt_balance)
  values (v_user_id, 0)
  on conflict (user_id) do nothing;

  select usdt_balance
    into v_balance
  from public.wallets
  where user_id = v_user_id
  for update;

  if v_balance is null then
    v_balance := 0;
  end if;

  if v_balance < v_price then
    raise exception 'Fondos insuficientes';
  end if;

  v_last4 := lpad((floor(random() * 10000))::int::text, 4, '0');
  v_exp_month := 12;
  v_exp_year := (extract(year from now())::int + 3);
  v_cardholder := btrim(
    coalesce(nullif(v_first_name, ''), '') ||
    case when coalesce(nullif(v_last_name, ''), '') <> '' then
      ' ' || v_last_name
    else
      ''
    end
  );
  if v_cardholder = '' then
    v_cardholder := coalesce(nullif(v_username, ''), p_buyer_telegram_id::text);
  end if;

  insert into public.cards (
    id,
    user_id,
    type,
    status,
    last_4,
    expiry_month,
    expiry_year,
    brand,
    currency,
    metadata
  ) values (
    v_card_id,
    v_user_id,
    'virtual'::public.card_type,
    'active'::public.card_status,
    v_last4,
    v_exp_month,
    v_exp_year,
    'visa',
    'USD',
    jsonb_build_object(
      'cardholder_name', v_cardholder
    )
  );

  insert into public.transactions (
    id,
    type,
    user_id,
    amount_usdt,
    status,
    metadata
  ) values (
    v_tx_id,
    'card_purchase',
    v_user_id,
    -v_price,
    'completed',
    jsonb_build_object(
      'description', 'Compra tarjeta virtual',
      'card_id', v_card_id,
      'card_type', 'virtual'
    )
  );

  card_id := v_card_id;
  transaction_id := v_tx_id;
  price_usdt := v_price;
  last_4 := v_last4;
  expiry_month := v_exp_month;
  expiry_year := v_exp_year;
  status := 'active'::public.card_status;
  brand := 'visa';
  cardholder_name := v_cardholder;
  return next;
end;
$$;

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

create or replace function public.prevent_referrals_reward_tampering()
returns trigger
language plpgsql
as $$
begin
  if new.referrer_user_id != old.referrer_user_id
    or new.referred_user_id != old.referred_user_id
    or new.reward_amount_usdt != old.reward_amount_usdt then
    raise exception 'No se permite modificar campos sensibles de referrals';
  end if;
  return new;
end;
$$;

create trigger a_referrals_prevent_reward_tampering
before update on public.referrals
for each row execute function public.prevent_referrals_reward_tampering();

create trigger referrals_set_updated_at
before update on public.referrals
for each row execute function public.set_updated_at();

alter table public.referrals enable row level security;

create policy referrals_select_own
on public.referrals for select
using (referrer_user_id in (select id from public.users where telegram_id = public.request_telegram_id()));

create or replace function public.referral_set_inviter(
  p_referred_telegram_id bigint,
  p_referrer_identifier text
)
returns table (referral_id uuid, status public.referral_status, reward_amount_usdt numeric(20, 6))
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referred_user_id uuid;
  v_referrer_user_id uuid;
  v_identifier text;
  v_username text;
  v_rate numeric(20, 6);
  v_referred_has_topup boolean;
  v_new_id uuid;
begin
  v_identifier := btrim(coalesce(p_referrer_identifier, ''));
  if v_identifier = '' then
    raise exception 'ID de referido inválido';
  end if;

  if left(v_identifier, 1) = '@' then
    v_identifier := substr(v_identifier, 2);
  end if;

  select id
    into v_referred_user_id
  from public.users
  where telegram_id = p_referred_telegram_id
  limit 1;

  if v_referred_user_id is null then
    raise exception 'Usuario no encontrado';
  end if;

  if v_identifier ~ '^[0-9]+$' then
    select id
      into v_referrer_user_id
    from public.users
    where telegram_id = v_identifier::bigint
    limit 1;
  else
    v_username := lower(v_identifier);
    select id
      into v_referrer_user_id
    from public.users
    where lower(coalesce(telegram_username, '')) = v_username
    limit 1;
  end if;

  if v_referrer_user_id is null then
    raise exception 'Referido no encontrado';
  end if;

  if v_referrer_user_id = v_referred_user_id then
    raise exception 'No se permite referirse a uno mismo';
  end if;

  select coalesce(nullif(value, '')::numeric(20, 6), 0.01::numeric(20, 6))
    into v_rate
  from public.config
  where key = 'diamond_to_usdt_rate'
  limit 1;

  if v_rate is null or v_rate <= 0 then
    v_rate := 0.01::numeric(20, 6);
  end if;

  select exists(
    select 1
    from public.transactions t
    where t.user_id = v_referred_user_id
      and t.type = 'topup'
      and t.status = 'completed'
      and t.amount_usdt > 0
  )
  into v_referred_has_topup;

  insert into public.referrals (
    referrer_user_id,
    referred_user_id,
    status,
    reward_amount_usdt
  ) values (
    v_referrer_user_id,
    v_referred_user_id,
    (case when v_referred_has_topup then 'eligible' else 'pending' end)::public.referral_status,
    v_rate
  )
  on conflict (referred_user_id) do nothing
  returning id into v_new_id;

  if v_new_id is null then
    raise exception 'Ya existe un referido asociado a tu cuenta';
  end if;

  return query
  select r.id, r.status, r.reward_amount_usdt
  from public.referrals r
  where r.id = v_new_id;
end;
$$;

create or replace function public.referral_refresh_eligibility(
  p_referrer_telegram_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_user_id uuid;
begin
  select id
    into v_referrer_user_id
  from public.users
  where telegram_id = p_referrer_telegram_id
  limit 1;

  if v_referrer_user_id is null then
    raise exception 'Usuario no encontrado';
  end if;

  update public.referrals r
  set status =
        (case
           when exists (
             select 1
             from public.transactions t
             where t.user_id = r.referred_user_id
               and t.type = 'topup'
               and t.status = 'completed'
               and t.amount_usdt > 0
           ) then 'eligible'
           else 'pending'
         end)::public.referral_status,
      updated_at = now()
  where r.referrer_user_id = v_referrer_user_id
    and r.status in ('pending'::public.referral_status, 'eligible'::public.referral_status);
end;
$$;

create or replace function public.referral_claim_rewards(
  p_referrer_telegram_id bigint
)
returns table (
  claimed_count int,
  total_usdt numeric(20, 6),
  claimed_from jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_user_id uuid;
begin
  select id
    into v_referrer_user_id
  from public.users
  where telegram_id = p_referrer_telegram_id
  limit 1;

  if v_referrer_user_id is null then
    raise exception 'Usuario no encontrado';
  end if;

  update public.referrals r
  set status =
        (case
           when exists (
             select 1
             from public.transactions t
             where t.user_id = r.referred_user_id
               and t.type = 'topup'
               and t.status = 'completed'
               and t.amount_usdt > 0
           ) then 'eligible'
           else 'pending'
         end)::public.referral_status,
      updated_at = now()
  where r.referrer_user_id = v_referrer_user_id
    and r.status in ('pending'::public.referral_status, 'eligible'::public.referral_status);

  with eligible as (
    select r.id,
           r.referred_user_id,
           r.reward_amount_usdt
    from public.referrals r
    where r.referrer_user_id = v_referrer_user_id
      and r.status = 'eligible'::public.referral_status
    for update
  ),
  ins_diamonds as (
    insert into public.diamonds_ledger (user_id, amount, reason)
    select v_referrer_user_id, 1, 'referral'
    from eligible
    returning 1
  ),
  ins_tx as (
    insert into public.transactions (type, user_id, amount_usdt, status, metadata)
    select
      'referral_conversion',
      v_referrer_user_id,
      e.reward_amount_usdt,
      'completed',
      jsonb_build_object(
        'description', 'Recompensa por referido',
        'referred_user_id', e.referred_user_id
      )
    from eligible e
    returning 1
  ),
  upd as (
    update public.referrals r
    set status = 'claimed'::public.referral_status,
        claimed_at = now(),
        updated_at = now()
    from eligible e
    where r.id = e.id
    returning r.referred_user_id
  )
  select
    (select count(*) from eligible)::int,
    coalesce((select sum(reward_amount_usdt) from eligible), 0::numeric(20, 6))::numeric(20, 6),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'telegram_id', u.telegram_id::text,
            'telegram_username', u.telegram_username,
            'telegram_first_name', u.telegram_first_name,
            'telegram_last_name', u.telegram_last_name
          )
        )
        from upd
        join public.users u on u.id = upd.referred_user_id
      ),
      '[]'::jsonb
    )
  into claimed_count, total_usdt, claimed_from;

  return next;
end;
$$;

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
  perform set_config('app.allow_diamonds_wallet_write', '1', true);

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

  perform set_config('app.allow_diamonds_wallet_write', '0', true);
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

create or replace function public.prevent_diamonds_wallet_manual_write()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.allow_diamonds_wallet_write', true) = '1' then
    if TG_OP = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  raise exception 'No se permite modificar diamonds_wallet directamente. Use diamonds_ledger.';
end;
$$;

create trigger a_diamonds_wallet_prevent_manual_write
before insert or update or delete on public.diamonds_wallet
for each row execute function public.prevent_diamonds_wallet_manual_write();

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
('min_withdrawal_usdt', '10.00'),
('min_topup_usdt', '1.00'),
('virtual_card_price_usdt', '30.00')
on conflict (key) do nothing;

alter table public.config enable row level security;
create policy config_read_all on public.config for select using (true);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin execute 'alter publication supabase_realtime add table public.wallets'; exception when others then null; end;
    begin execute 'alter publication supabase_realtime add table public.transactions'; exception when others then null; end;
    begin execute 'alter publication supabase_realtime add table public.referrals'; exception when others then null; end;
    begin execute 'alter publication supabase_realtime add table public.cards'; exception when others then null; end;
  end if;
end;
$$;

do $$
begin
  begin execute 'revoke insert, update, delete on table public.wallets from anon, authenticated'; exception when others then null; end;
  begin execute 'revoke insert, update, delete on table public.diamonds_wallet from anon, authenticated'; exception when others then null; end;
  begin execute 'revoke update on table public.referrals from anon, authenticated'; exception when others then null; end;
end;
$$;
