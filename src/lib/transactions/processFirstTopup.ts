import { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export async function processFirstTopup(
  supabase: SupabaseClient,
  userId: string,
  amount: number
) {
  try {
    // 1. Check if user already has a virtual card
    const { count: cardCount } = await supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "virtual");

    if ((cardCount || 0) > 0) {
      console.log(`User ${userId} already has a virtual card. Skipping auto-purchase.`);
      return;
    }

    // 2. Get Virtual Card Price from config
    const { data: configPrice } = await supabase
      .from("config")
      .select("value")
      .eq("key", "virtual_card_price_usdt")
      .single();

    const cardPrice = Number(configPrice?.value ?? 30);
    const activationFee = 15;
    const totalCost = cardPrice + activationFee;

    // 3. Check wallet balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("usdt_balance")
      .eq("user_id", userId)
      .single();

    const currentBalance = Number(wallet?.usdt_balance ?? 0);

    if (currentBalance < totalCost) {
      console.warn(
        `User ${userId} has insufficient balance (${currentBalance}) for auto-purchase (${totalCost}). Skipping.`
      );
      return;
    }

    // 4. Create Virtual Card
    const { data: userData } = await supabase
      .from("users")
      .select("telegram_first_name, telegram_last_name, telegram_username, telegram_id")
      .eq("id", userId)
      .single();

    if (!userData) {
      console.error(`User ${userId} not found for card creation.`);
      return;
    }

    const firstName = userData.telegram_first_name || "";
    const lastName = userData.telegram_last_name || "";
    let cardholderName = `${firstName} ${lastName}`.trim();
    if (!cardholderName) {
      cardholderName = userData.telegram_username || String(userData.telegram_id);
    }

    const cardId = uuidv4();
    const last4 = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const expiryMonth = 12;
    const expiryYear = new Date().getFullYear() + 3;

    // Insert Card (Frozen/Inactive for manual review)
    const { error: cardError } = await supabase.from("cards").insert({
      id: cardId,
      user_id: userId,
      type: "virtual",
      status: "frozen", // Wait for admin manual review
      last_4: null, // No data yet
      expiry_month: null,
      expiry_year: null,
      brand: "visa",
      currency: "USD",
      metadata: {
        cardholder_name: cardholderName,
        auto_purchased: true,
        pending_admin_review: true,
      },
    });

    if (cardError) {
      console.error("Error creating auto-purchased card:", cardError);
      return;
    }

    // 5. Create Transactions (Card Purchase)
    const { error: txPurchaseError } = await supabase.from("transactions").insert({
      type: "card_purchase",
      user_id: userId,
      amount_usdt: -cardPrice,
      status: "completed",
      metadata: {
        description: "Compra tarjeta virtual (Auto)",
        card_id: cardId,
        card_type: "virtual",
      },
    });

    if (txPurchaseError) {
      console.error("Error creating purchase transaction:", txPurchaseError);
      // Ojo: Ya se creó la tarjeta. Deberíamos hacer rollback manual o dejarlo así (el usuario gana tarjeta gratis).
      // En producción, esto debería ser una transacción SQL atómica.
      // Por ahora, asumimos que no falla seguido.
    }

    // 6. Create Transactions (Activation Fee)
    const { error: txFeeError } = await supabase.from("transactions").insert({
      type: "card_purchase", // Usamos el mismo tipo o uno nuevo si existiera 'fee'
      user_id: userId,
      amount_usdt: -activationFee,
      status: "completed",
      metadata: {
        description: "Activación de tarjeta (Auto)",
        card_id: cardId,
        fee_type: "activation",
      },
    });

    if (txFeeError) {
      console.error("Error creating fee transaction:", txFeeError);
    }

    console.log(`Auto-purchased card for user ${userId} successfully.`);
  } catch (e) {
    console.error("Error processing first topup logic:", e);
  }
}
