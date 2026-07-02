import { NextResponse } from "next/server";
import { getStripe, getAppUrl } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json(
      {
        demo: true,
        message:
          "Stripe n'est pas encore configuré. Le portail client sera disponible une fois STRIPE_SECRET_KEY renseignée.",
      },
      { status: 200 }
    );
  }

  let customerId: string | undefined;
  try {
    const body = await request.json();
    customerId = body?.customerId;
  } catch {
    // corps vide accepté : à connecter à la session utilisateur réelle
  }

  if (!customerId) {
    return NextResponse.json(
      {
        error:
          "customerId manquant. Reliez cette route à votre système d'authentification pour retrouver le client Stripe.",
      },
      { status: 400 }
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
