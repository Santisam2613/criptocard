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

    // 1. Si ya tiene ID, intentar recuperarlo y actualizarlo si es necesario (modo test)
    if (user.stripeCardholderId) {
      try {
        const existing = await stripe.issuing.cardholders.retrieve(user.stripeCardholderId);
        const requirementsDue =
          (existing.requirements?.disabled_reason != null) ||
          (existing.requirements?.past_due?.length ?? 0) > 0;

        // Si no está activo o le faltan datos, actualizarlo
        if (existing.status !== "active" || requirementsDue) {
          try {
            await stripe.issuing.cardholders.update(user.stripeCardholderId, {
              status: "active",
              individual: {
                first_name: user.firstName || "Criptocard",
                last_name: user.lastName || "User",
                dob: {
                  day: 1,
                  month: 1,
                  year: 1990,
                },
                ...(termsAcceptance ?? {}),
              },
              billing: {
                address: {
                  country: "US",
                  line1: "123 Main St",
                  city: "San Francisco",
                  state: "CA",
                  postal_code: "94111",
                },
              },
            });

            const updated = await stripe.issuing.cardholders.retrieve(user.stripeCardholderId);
            const stillDue =
              (updated.requirements?.disabled_reason != null) ||
              (updated.requirements?.past_due?.length ?? 0) > 0;
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
          country: "US", // Ajustar según KYC real
          line1: "123 Main St", // Placeholder, debería venir del KYC
          city: "San Francisco",
          state: "CA",
          postal_code: "94111",
        },
      },
      individual: {
        first_name: user.firstName || "Criptocard",
        last_name: user.lastName || "User",
        dob: {
          day: 1,
          month: 1,
          year: 1990,
        },
        ...(termsAcceptance ?? {}),
      },
      metadata: {
        user_id: user.id, // Vínculo inverso importante para conciliación
      },
    });

    const created = await stripe.issuing.cardholders.retrieve(cardholder.id);
    const requirementsDue =
      (created.requirements?.disabled_reason != null) ||
      (created.requirements?.past_due?.length ?? 0) > 0;
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
