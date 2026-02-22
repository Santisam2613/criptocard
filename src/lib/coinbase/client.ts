import crypto from "crypto";

const COINBASE_API_URL = "https://api.commerce.coinbase.com";
const API_VERSION = "2018-03-22";

export class CoinbaseClient {
  private apiKey: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.COINBASE_COMMERCE_API_KEY || "";
    this.webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || "";

    if (!this.apiKey) {
      console.warn("Missing COINBASE_COMMERCE_API_KEY");
    }
    if (!this.webhookSecret) {
      console.warn("Missing COINBASE_COMMERCE_WEBHOOK_SECRET");
    }
  }

  /**
   * Create a charge
   */
  async createCharge(params: {
    name: string;
    description: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
    redirectUrl?: string;
    cancelUrl?: string;
  }) {
    if (!this.apiKey) throw new Error("Coinbase Commerce API Key not configured");

    const payload = {
      name: params.name,
      description: params.description,
      pricing_type: "fixed_price",
      local_price: {
        amount: params.amount.toString(),
        currency: params.currency,
      },
      metadata: params.metadata,
      redirect_url: params.redirectUrl,
      cancel_url: params.cancelUrl,
    };

    const res = await fetch(`${COINBASE_API_URL}/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": this.apiKey,
        "X-CC-Version": API_VERSION,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Coinbase API error: ${res.status} ${errorText}`);
    }

    return res.json();
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret) return false;

    const hmac = crypto.createHmac("sha256", this.webhookSecret);
    hmac.update(rawBody);
    const computedSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  }
}

export const coinbaseClient = new CoinbaseClient();
