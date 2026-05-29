import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

export const PLANS = {
  basic: {
    name: "Basic",
    pricePence: 1900,
    priceId: process.env.STRIPE_BASIC_PRICE_ID ?? "",
    features: ["Up to 20 students", "Calendar & bookings", "Lesson notes"],
  },
  standard: {
    name: "Standard",
    pricePence: 2900,
    priceId: process.env.STRIPE_STANDARD_PRICE_ID ?? "",
    features: ["Unlimited students", "Full progress tracking", "Priority email support"],
  },
  premium: {
    name: "Premium",
    pricePence: 4900,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
    features: ["Everything in Standard", "WhatsApp automation", "Priority support"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
