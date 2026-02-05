## Supabase Edge Function: sumsub-webhook

Esta función recibe webhooks de Sumsub, valida la firma HMAC, deduplica eventos y actualiza el estado KYC en `public.users`.

### Secretos requeridos (Supabase)

Configura estos secretos en tu proyecto de Supabase (Edge Functions):

- `SUMSUB_WEBHOOK_SECRET_KEY`: el secret configurado en Sumsub Webhooks.
- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key para escribir en tablas con RLS habilitado.

### Despliegue (CLI)

```bash
supabase functions deploy sumsub-webhook
supabase secrets set \
  SUMSUB_WEBHOOK_SECRET_KEY="..." \
  SUPABASE_URL="..." \
  SUPABASE_SERVICE_ROLE_KEY="..."
```

### Configuración en Sumsub

En Sumsub Cockpit → Webhooks:

- URL: `https://<PROJECT_REF>.functions.supabase.co/sumsub-webhook`
- Secret: el mismo valor de `SUMSUB_WEBHOOK_SECRET_KEY`
- Evento: `applicantReviewed`

### Notas

- No es necesario cambiar políticas RLS si la función usa `SUPABASE_SERVICE_ROLE_KEY`.
- La función guarda todos los webhooks en `public.sumsub_webhook_events` con `event_hash` único para deduplicación.

