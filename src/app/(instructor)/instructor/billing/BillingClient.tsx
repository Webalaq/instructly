"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type PlanKey } from "@/lib/stripe/client";

type Subscription = {
  instructor_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  trial_ends_at: string | null;
};

type PlanInfo = {
  name: string;
  pricePence: number;
  priceId: string;
  features: readonly string[];
};

interface BillingClientProps {
  subscription: Subscription | null;
  plans: Record<PlanKey, PlanInfo>;
}

export default function BillingClient({ subscription, plans }: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: PlanKey) {
    setLoading(plan);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) {
      globalThis.location.assign(data.url);
    }
    setLoading(null);
  }

  async function handlePortal() {
    setLoading("portal");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      globalThis.location.assign(data.url);
    }
    setLoading(null);
  }

  const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    trialing: "secondary",
    past_due: "destructive",
    canceled: "outline",
  };

  return (
    <div className="space-y-8">
      {/* Current plan */}
      {subscription && (
        <div className="rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {plans[subscription.plan as PlanKey]?.name ?? subscription.plan} plan
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={STATUS_COLORS[subscription.status] ?? "outline"}>
                  {subscription.status}
                </Badge>
                {subscription.current_period_end && (
                  <span className="text-sm text-muted-foreground">
                    Renews {new Date(subscription.current_period_end).toLocaleDateString("en-GB")}
                  </span>
                )}
              </div>
              {subscription.trial_ends_at && subscription.status === "trialing" && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString("en-GB")}
                </p>
              )}
            </div>
            {subscription.stripe_customer_id && (
              <Button
                variant="outline"
                onClick={handlePortal}
                disabled={loading === "portal"}
              >
                {loading === "portal" ? "Loading..." : "Manage payment"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.entries(plans) as [PlanKey, PlanInfo][]).map(([key, plan]) => {
          const isCurrent = subscription?.plan === key;
          return (
            <div
              key={key}
              className={`rounded-lg border p-6 ${isCurrent ? "border-primary ring-1 ring-primary" : ""}`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">£{(plan.pricePence / 100).toFixed(0)}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-primary">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout(key)}
                    disabled={loading === key}
                  >
                    {loading === key ? "Loading..." : subscription ? "Switch" : "Start free trial"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
