import Stripe from "stripe";

import { createStripe } from "@/lib/stripe/client";

// Inicialización Lazy del cliente
let stripeClient: Stripe | null = null;

function getStripe() {
  if (stripeClient) return stripeClient;
  stripeClient = createStripe();
  return stripeClient;
}

export const stripeService = {
  /**
   * Crea o recupera un Cardholder en Stripe para un usuario.
   */
  async getOrCreateCardholder(user: {
    id: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    stripeCardholderId?: string;
    termsAcceptance?: { ip: string; date: number };
    billingAddress?: {
      country: string;
      line1: string;
      city: string;
      state?: string;
      postalCode: string;
    };
    dob?: { day: number; month: number; year: number };
  }) {
    const stripe = getStripe();

    const termsAcceptance = user.termsAcceptance
      ? {
          card_issuing: {
            user_terms_acceptance: {
              ip: user.termsAcceptance.ip,
              date: user.termsAcceptance.date,
            },
          },
        }
      : undefined;

    const billingAddress = user.billingAddress ?? {
      country: "US",
      line1: "123 Main St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94111",
    };
    const dob = user.dob ?? { day: 1, month: 1, year: 1990 };

    // 1. Si ya tiene ID, intentar recuperarlo y actualizarlo si es necesario (modo test)
    if (user.stripeCardholderId) {
      try {
        const existing = await stripe.issuing.cardholders.retrieve(user.stripeCardholderId);
        const disabledReason = existing.requirements?.disabled_reason ?? null;
        const pastDueCount = existing.requirements?.past_due?.length ?? 0;
        const requirementsDue =
          pastDueCount > 0 || (disabledReason != null && disabledReason !== "under_review");

        // Si no está activo o le faltan datos, actualizarlo
        if (existing.status !== "active" || requirementsDue) {
          try {
            await stripe.issuing.cardholders.update(user.stripeCardholderId, {
              status: "active",
              individual: {
                first_name: user.firstName || "Criptocard",
                last_name: user.lastName || "User",
                dob: {
                  day: dob.day,
                  month: dob.month,
                  year: dob.year,
                },
                ...(termsAcceptance ?? {}),
              },
              billing: {
                address: {
                  country: billingAddress.country,
                  line1: billingAddress.line1,
                  city: billingAddress.city,
                  state: billingAddress.state,
                  postal_code: billingAddress.postalCode,
                },
              },
            });

            const updated = await stripe.issuing.cardholders.retrieve(user.stripeCardholderId);
            const updatedDisabled = updated.requirements?.disabled_reason ?? null;
            const updatedPastDue = updated.requirements?.past_due?.length ?? 0;
            const stillDue = updatedPastDue > 0 || (updatedDisabled != null && updatedDisabled !== "under_review");
            if (stillDue) {
              throw new Error(
                `Cardholder incompleto: ${JSON.stringify(updated.requirements)}`,
              );
            }
            return user.stripeCardholderId;
          } catch (updateError) {
            console.warn(
              "No se pudo actualizar cardholder, se creará uno nuevo",
              updateError,
            );
          }
        } else {
          return user.stripeCardholderId;
        }
      } catch (e) {
        console.warn("Error recuperando/actualizando cardholder existente, se creará uno nuevo", e);
        // Si falla (ej. borrado en Stripe), dejar que continúe para crear uno nuevo
      }
    }

    // 2. Crear nuevo Cardholder
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Criptocard User";
    const cardholder = await stripe.issuing.cardholders.create({
      name,
      email: user.email,
      phone_number: user.phone, // Formato E.164 requerido por Stripe
      status: "active",
      type: "individual",
      billing: {
        address: {
          country: billingAddress.country,
          line1: billingAddress.line1,
          city: billingAddress.city,
          state: billingAddress.state,
          postal_code: billingAddress.postalCode,
        },
      },
      individual: {
        first_name: user.firstName || "Criptocard",
        last_name: user.lastName || "User",
        dob: {
          day: dob.day,
          month: dob.month,
          year: dob.year,
        },
        ...(termsAcceptance ?? {}),
      },
      metadata: {
        user_id: user.id, // Vínculo inverso importante para conciliación
      },
    });

    const created = await stripe.issuing.cardholders.retrieve(cardholder.id);
    const createdDisabled = created.requirements?.disabled_reason ?? null;
    const createdPastDue = created.requirements?.past_due?.length ?? 0;
    const requirementsDue =
      createdPastDue > 0 || (createdDisabled != null && createdDisabled !== "under_review");
    if (requirementsDue) {
      throw new Error(`Cardholder incompleto: ${JSON.stringify(created.requirements)}`);
    }

    return cardholder.id;
  },

  /**
   * Emite una tarjeta virtual para un Cardholder.
   */
  async createVirtualCard(cardholderId: string, currency = "usd") {
    const stripe = getStripe();

    const card = await stripe.issuing.cards.create({
      cardholder: cardholderId,
      currency,
      type: "virtual",
      status: "active",
      metadata: {
        platform: "criptocard",
      },
    });

    return card;
  },

  async updateIssuingCardStatus(cardId: string, status: "active" | "inactive") {
    const stripe = getStripe();
    await stripe.issuing.cards.update(cardId, { status });
  },

  async getIssuingCardSensitiveDetails(cardId: string) {
    const stripe = getStripe();
    const card = await stripe.issuing.cards.retrieve(cardId, { expand: ["number", "cvc"] });
    return {
      cvc: card.cvc ?? null,
      number: card.number ?? null,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      last4: card.last4,
    };
  },
};
