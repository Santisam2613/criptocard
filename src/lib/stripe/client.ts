import Stripe from "stripe";

import { getServerCredentials } from "@/config/credentials";

import { STRIPE_API_VERSION } from "@/lib/stripe/config";

export function createStripe(secretKey?: string) {
  const key = secretKey ?? getServerCredentials().stripe?.secretKey;
  if (!key) throw new Error("Stripe no configurado (falta STRIPE_SECRET_KEY)");
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}
