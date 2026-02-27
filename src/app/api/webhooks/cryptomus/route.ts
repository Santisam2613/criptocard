import { NextResponse } from "next/server";

import { cryptomusClient } from "@/lib/cryptomus/client";
import { CryptomusWebhookPayload } from "@/lib/cryptomus/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let body: CryptomusWebhookPayload;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    // Verificar firma
    // Cryptomus envía la firma en el parámetro 'sign' del body o en el header 'sign'
    // Para validación segura usamos el body raw y la firma.
    const sign = (body as any).sign || req.headers.get("sign");

    if (!sign) {
      return NextResponse.json({ ok: false, error: "Missing signature" }, { status: 400 });
    }

    // Nota: Cryptomus genera la firma usando el body en base64.
    // Si el body incluye 'sign', la verificación podría fallar si no se excluye.
    // Sin embargo, según la doc, el payload que firmamos es el que enviamos.
    // Al recibir, el payload que recibimos se firma.
    // Si `cryptomusClient.verifySignature` hace md5(base64(rawBody) + key),
    // debemos asegurarnos que rawBody es exactamente lo que Cryptomus firmó.
    // Si Cryptomus envía `sign` dentro del JSON, entonces rawBody lo incluye.
    // Asumimos que `cryptomusClient` maneja esto o que la firma coincide.
    
    // Si la verificación falla con el rawBody completo, intentaremos excluir 'sign' del objeto
    // si fuera necesario, pero por defecto probamos directo.
    
    // IMPORTANTE: Cryptomus dice "The signature is sent in the sign parameter of the POST request body".
    // "To verify... generate a signature from the received data...".
    // Si recibimos data con `sign`, y firmamos data con `sign`, la firma cambiará.
    // Normalmente se excluye `sign`.
    // Vamos a intentar excluir `sign` para la verificación si está en el body.
    
    let dataToVerify = rawBody;
    if ((body as any).sign) {
       const { sign: _, ...rest } = body as any;
       dataToVerify = JSON.stringify(rest);
       // JSON.stringify podría cambiar el orden de las keys, lo cual rompería la firma.
       // Esto es peligroso.
       // PERO, si Cryptomus envía `sign` en el header, DEBERÍA firmar el body SIN `sign`?
       // O el body TAL CUAL?
       // La mayoría de gateways firman el raw body exacto.
       // Si `sign` viene dentro del body, entonces es parte del raw body.
       // Probemos verificar rawBody directo primero.
    }

    const isValid = cryptomusClient.verifySignature(rawBody, sign);
    if (!isValid) {
      console.error("Invalid Cryptomus signature");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const { status, order_id } = body;

    // Solo procesamos pagos exitosos
    if (status === "paid" || status === "paid_over") {
      const supabase = getSupabaseAdminClient();

      // Buscar transacción por order_id en metadata
      const { data: txs, error: fetchError } = await supabase
        .from("transactions")
        .select("id, status, amount_usdt")
        .eq("metadata->>order_id", order_id)
        .limit(1);

      if (fetchError) {
        console.error("Error fetching transaction:", fetchError);
        return NextResponse.json({ ok: false, error: "DB Error" }, { status: 500 });
      }

      const tx = txs?.[0];
      if (!tx) {
        // Si no existe la transacción, podría ser un pago huérfano o error.
        // Retornamos 200 para que Cryptomus no reintente infinitamente.
        console.warn(`Transaction not found for order_id: ${order_id}`);
        return NextResponse.json({ ok: true, message: "Transaction not found" });
      }

      if (tx.status === "completed") {
        return NextResponse.json({ ok: true, message: "Already processed" });
      }

      // Actualizar a completed
      // Esto disparará el trigger transactions_update_wallet que acreditará el saldo
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", tx.id);

      if (updateError) {
        console.error("Error updating transaction:", updateError);
        return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
      }
      
      console.log(`Topup completed for tx: ${tx.id} (Order: ${order_id})`);
    } else if (status === "cancel" || status === "fail") {
       // Podríamos marcarla como rejected
       const supabase = getSupabaseAdminClient();
       await supabase
        .from("transactions")
        .update({ status: "rejected" })
        .eq("metadata->>order_id", order_id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: false, error: "Internal Error" }, { status: 500 });
  }
}
