import { NextResponse } from "next/server";
import { getStripe, getPriceId, getAppUrl } from "@/lib/stripe";
import { findPlan } from "@/lib/pricing";

export async function POST(request: Request) {
  let planId: string | undefined;
  try {
    const body = await request.json();
    planId = body?.planId;
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide. Attendu : { planId: string }." },
      { status: 400 }
    );
  }

  if (!planId) {
    return NextResponse.json(
      { error: "Le champ planId est requis." },
      { status: 400 }
    );
  }

  const plan = findPlan(planId);
  if (!plan) {
    return NextResponse.json(
      { error: `Aucune offre ne correspond à « ${planId} ».` },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  const priceId = getPriceId(planId);

  if (!stripe || !priceId) {
    // Mode démonstration : Stripe n'est pas encore configuré.
    return NextResponse.json(
      {
        demo: true,
        message:
          "Stripe n'est pas encore configuré. Ajoutez STRIPE_SECRET_KEY et les price IDs dans .env pour activer le paiement.",
        plan: { id: plan.id, name: plan.name, price: plan.price },
      },
      { status: 200 }
    );
  }

  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: plan.mode === "subscription" ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success&plan=${plan.id}`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
    allow_promotion_codes: true,
    metadata: { planId: plan.id },
  });

  return NextResponse.json({ url: session.url });
}
