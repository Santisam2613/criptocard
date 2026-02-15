import type Stripe from "stripe";

export const STRIPE_API_VERSION = (process.env.STRIPE_API_VERSION ??
  "2026-01-28.clover") as Stripe.LatestApiVersion;
