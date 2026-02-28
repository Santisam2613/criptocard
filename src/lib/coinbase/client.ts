import { Client, resources } from "coinbase-commerce-node";

const API_KEY = process.env.COINBASE_COMMERCE_API_KEY;

if (!API_KEY) {
  console.warn("Falta COINBASE_COMMERCE_API_KEY en variables de entorno");
}

Client.init(API_KEY || "");

export const Charge = resources.Charge;
export const Webhook = resources.Webhook;
