import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

/**
 * Webhook Stripe.
 * Événements gérés : checkout terminé, abonnement créé / mis à jour / annulé,
 * échec de paiement. Chaque branche est prête à être reliée à votre base
 * de données (mise à jour des crédits et du statut d'abonnement).
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { received: false, message: "Webhook non configuré (clés manquantes)." },
      { status: 200 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Signature stripe-signature manquante." },
      { status: 400 }
    );
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO : créditer l'utilisateur (session.metadata.planId) et
      // enregistrer session.customer pour le Customer Portal.
      console.info("[stripe] checkout complété :", session.id);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      // TODO : synchroniser le statut d'abonnement et les crédits mensuels.
      console.info("[stripe] abonnement mis à jour :", subscription.id);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      // TODO : désactiver l'accès aux crédits à la fin de la période.
      console.info("[stripe] abonnement annulé :", subscription.id);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // TODO : notifier l'utilisateur et marquer l'abonnement past_due.
      console.warn("[stripe] paiement échoué :", invoice.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
