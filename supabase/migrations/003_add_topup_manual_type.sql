-- Agregar 'topup_manual' al enum transaction_type si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'topup_manual' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')) THEN
        ALTER TYPE public.transaction_type ADD VALUE 'topup_manual';
    END IF;
END$$;
