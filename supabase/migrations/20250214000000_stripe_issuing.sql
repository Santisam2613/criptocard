-- ==============================================================================
-- 11. STRIPE ISSUING & INTEGRACIÓN (Migration)
-- ==============================================================================

-- 1. Agregar referencia al Cardholder de Stripe en la tabla de usuarios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_cardholder_id text;
CREATE INDEX IF NOT EXISTS users_stripe_cardholder_id_idx ON public.users(stripe_cardholder_id);

-- 2. Agregar tipo de transacción para gastos con tarjeta
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'card_authorization';

-- 3. RPC: Deducir saldo para compra de tarjeta (Atómico)
-- Esta función verifica saldo, lo deduce y crea la transacción.
-- Se usa ANTES de llamar a Stripe para asegurar fondos.
CREATE OR REPLACE FUNCTION public.deduct_balance_for_card(
  p_user_id uuid,
  p_amount numeric(20, 6)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric(20, 6);
  v_tx_id uuid;
BEGIN
  -- Bloquear wallet para lectura consistente
  SELECT usdt_balance INTO v_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    v_balance := 0;
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Fondos insuficientes';
  END IF;

  -- Insertar transacción (el trigger actualizará la wallet)
  INSERT INTO public.transactions (
    type,
    user_id,
    amount_usdt,
    status,
    metadata
  ) VALUES (
    'card_purchase',
    p_user_id,
    -p_amount,
    'completed',
    jsonb_build_object(
      'description', 'Compra tarjeta virtual (Procesando)'
    )
  );
END;
$$;

-- 4. RPC: Reembolsar saldo si falla Stripe (Compensación)
CREATE OR REPLACE FUNCTION public.refund_balance_for_card(
  p_user_id uuid,
  p_amount numeric(20, 6)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.transactions (
    type,
    user_id,
    amount_usdt,
    status,
    metadata
  ) VALUES (
    'card_purchase',
    p_user_id,
    p_amount, -- Positivo para reembolso
    'completed',
    jsonb_build_object(
      'description', 'Reembolso por fallo en emisión'
    )
  );
END;
$$;

-- 5. RPC: Verificar saldo disponible (Para Webhook de Autorización)
-- Retorna true si tiene suficiente saldo, sin modificar nada.
CREATE OR REPLACE FUNCTION public.check_wallet_balance(
  p_user_id uuid,
  p_amount numeric(20, 6)
)
RETURNS TABLE (sufficient boolean, current_balance numeric(20, 6))
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT usdt_balance INTO current_balance
  FROM public.wallets
  WHERE user_id = p_user_id;

  IF current_balance IS NULL THEN
    current_balance := 0;
  END IF;

  sufficient := (current_balance >= p_amount);
  RETURN NEXT;
END;
$$;

-- 6. RPC: Registrar transacción de tarjeta (Para Webhook de Captura/Settlement)
-- Deduce el saldo real cuando llega el evento issuing_transaction.created
CREATE OR REPLACE FUNCTION public.record_card_transaction(
  p_user_id uuid,
  p_amount numeric(20, 6), -- Monto positivo (se negará dentro)
  p_stripe_tx_id text,
  p_merchant text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Idempotencia: Verificar si ya procesamos esta tx de Stripe
  SELECT EXISTS (
    SELECT 1 FROM public.transactions
    WHERE metadata->>'stripe_tx_id' = p_stripe_tx_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN; -- Ya procesada, ignorar
  END IF;

  INSERT INTO public.transactions (
    type,
    user_id,
    amount_usdt,
    status,
    metadata
  ) VALUES (
    'card_authorization',
    p_user_id,
    -p_amount, -- Restar saldo
    'completed',
    jsonb_build_object(
      'stripe_tx_id', p_stripe_tx_id,
      'merchant', p_merchant,
      'description', 'Compra con tarjeta: ' || p_merchant
    )
  );
END;
$$;
