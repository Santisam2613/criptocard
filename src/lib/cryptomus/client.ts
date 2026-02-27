import crypto from "crypto";

const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID;
const PAYMENT_KEY = process.env.CRYPTOMUS_PAYMENT_KEY;

if (!MERCHANT_ID || !PAYMENT_KEY) {
  console.warn("Cryptomus credentials are missing in environment variables.");
}

export const cryptomusClient = {
  /**
   * Generates the signature required for Cryptomus API requests.
   * MD5(base64(data) + API_KEY)
   */
  generateSignature(data: string): string {
    if (!PAYMENT_KEY) throw new Error("Missing CRYPTOMUS_PAYMENT_KEY");
    const base64Data = Buffer.from(data).toString("base64");
    return crypto
      .createHash("md5")
      .update(base64Data + PAYMENT_KEY)
      .digest("hex");
  },

  /**
   * Verifies the signature from a webhook request.
   * MD5(base64(data) + API_KEY) === sign
   */
  verifySignature(data: string, sign: string): boolean {
    if (!PAYMENT_KEY) return false;
    const computedSign = this.generateSignature(data);
    return computedSign === sign;
  },

  /**
   * Creates a payment invoice.
   */
  async createPayment(payload: any) {
    if (!MERCHANT_ID) throw new Error("Missing CRYPTOMUS_MERCHANT_ID");

    const data = JSON.stringify(payload);
    const sign = this.generateSignature(data);

    const response = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        merchant: MERCHANT_ID,
        sign: sign,
        "Content-Type": "application/json",
      },
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cryptomus API Error: ${response.status} ${errorText}`);
    }

    return response.json();
  },
};
