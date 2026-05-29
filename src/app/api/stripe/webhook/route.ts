import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/client";
import type Stripe from "stripe";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  function getPeriodEnd(sub: Stripe.Subscription): string | null {
    const item = sub.items.data[0];
    if (item?.current_period_end) {
      return new Date(item.current_period_end * 1000).toISOString();
    }
    return null;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const instructorId = session.subscription
        ? (await stripe.subscriptions.retrieve(session.subscription as string)).metadata.instructor_id
        : null;

      if (instructorId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await supabase.from("subscriptions").upsert(
          {
            instructor_id: instructorId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: sub.id,
            plan: sub.metadata.plan ?? "basic",
            status: sub.status === "trialing" ? "trialing" : "active",
            current_period_end: getPeriodEnd(sub),
            trial_ends_at: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
          },
          { onConflict: "instructor_id" }
        );
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const instructorId = sub.metadata.instructor_id;

      if (instructorId) {
        const statusMap: Record<string, string> = {
          trialing: "trialing",
          active: "active",
          past_due: "past_due",
          canceled: "canceled",
          unpaid: "past_due",
          incomplete: "past_due",
          incomplete_expired: "canceled",
          paused: "past_due",
        };

        await supabase
          .from("subscriptions")
          .update({
            plan: sub.metadata.plan ?? "basic",
            status: statusMap[sub.status] ?? "canceled",
            current_period_end: getPeriodEnd(sub),
            trial_ends_at: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
          })
          .eq("instructor_id", instructorId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
