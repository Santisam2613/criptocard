import Stripe from "stripe";

const args = process.argv.slice(2);
const vercelUrl = args[0];

if (!vercelUrl) {
  console.error("❌ Error: Debes proporcionar la URL de tu proyecto en Vercel.");
  console.error("Ejemplo: npx tsx scripts/setup-stripe-webhook.ts https://mi-proyecto.vercel.app");
  process.exit(1);
}

const webhookUrl = `${vercelUrl.replace(/\/$/, "")}/api/webhooks/stripe`;
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error("❌ Error: No se encontró STRIPE_SECRET_KEY en las variables de entorno.");
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: "2026-01-28.clover" });

async function setupWebhook() {
  console.log(`🔌 Configurando webhook en Stripe hacia: ${webhookUrl}...`);

  try {
    const endpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        "issuing_authorization.request",
        "issuing_transaction.created",
      ],
      description: "Criptocard Issuing Webhook (Created via Script)",
    });

    console.log("\n✅ Webhook creado exitosamente!");
    console.log("---------------------------------------------------");
    console.log(`ID: ${endpoint.id}`);
    console.log(`Signing Secret: ${endpoint.secret}`);
    console.log("---------------------------------------------------");
    console.log("⚠️  IMPORTANTE: Copia el 'Signing Secret' de arriba y agrégalo");
    console.log("    a las variables de entorno de Vercel como STRIPE_WEBHOOK_SECRET");
  } catch (error: any) {
    console.error("❌ Error creando webhook:", error.message);
  }
}

setupWebhook();
