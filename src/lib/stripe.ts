import Stripe from "stripe";
import { getSetting, setSetting } from "@/lib/settings";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});

const PORTAL_CONFIGURATION_SETTING_KEY = "stripePortalConfigurationId";

/**
 * The Customer Portal's own cancellation default is immediate — this configuration
 * enforces "at end of billing period" at the Stripe level too, so the product's
 * cancellation policy holds even if a customer cancels from the portal directly
 * rather than the app's own "Cancel subscription" button. Created once and reused;
 * the resulting configuration ID is cached in Setting so we don't accumulate
 * duplicate configurations on every portal-session request.
 */
export async function getOrCreatePortalConfiguration(): Promise<string> {
  const existingId = await getSetting(PORTAL_CONFIGURATION_SETTING_KEY);
  if (existingId) {
    try {
      const existing = await stripe.billingPortal.configurations.retrieve(existingId);
      if (existing.active) return existing.id;
    } catch {
      // Configuration was deleted or is otherwise unreachable — fall through and recreate.
    }
  }

  const configuration = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Manage your Site Brief subscription",
    },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
      },
    },
  });

  await setSetting(PORTAL_CONFIGURATION_SETTING_KEY, configuration.id);
  return configuration.id;
}
