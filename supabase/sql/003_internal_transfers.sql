-- ==============================================================================
-- 11. TRANSFERENCIAS INTERNAS (Helper RPC)
-- ==============================================================================

create or replace function public.create_internal_transfer(
  p_sender_telegram_id bigint,
  p_recipient_telegram_id bigint,
  p_amount_usdt numeric(20, 6)
)
returns uuid
language plpgsql
security definer
as $$
declare
  sender_user_id uuid;
  recipient_user_id uuid;
  sender_balance numeric(20, 6);
  transfer_group_id uuid := gen_random_uuid();
  sender_name text;
  recipient_name text;
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
         coalesce(nullif(telegram_username, ''), nullif(telegram_first_name, ''), telegram_id::text)
    into recipient_user_id, recipient_name
  from public.users
  where telegram_id = p_recipient_telegram_id
  limit 1;

  if recipient_user_id is null then
    raise exception 'Destinatario no encontrado';
  end if;

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

