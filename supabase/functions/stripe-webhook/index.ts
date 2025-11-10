import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY_2") || Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    log("Webhook received");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No stripe-signature header");
    }

    const body = await req.text();
    
    // Vérifier la signature du webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
      log("Webhook signature verified", { type: event.type });
    } catch (err) {
      log("Webhook signature verification failed", { error: String(err) });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    // Initialiser Supabase avec service role pour bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Gérer les différents événements
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        log("Checkout completed", { sessionId: session.id, customerEmail: session.customer_email });
        
        if (session.customer_email && session.mode === "subscription") {
          // Trouver le user_id depuis l'email
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("email", session.customer_email)
            .single();

          if (profile) {
            // Ajouter ou mettre à jour premium_users
            const { error } = await supabase
              .from("premium_users")
              .upsert({
                user_id: profile.user_id,
                granted_by: "stripe_webhook",
                notes: `Stripe subscription - Session: ${session.id}`,
                granted_at: new Date().toISOString(),
              }, {
                onConflict: "user_id"
              });

            if (error) {
              log("Error upserting premium_users", { error });
            } else {
              log("User premium status updated", { userId: profile.user_id });
            }
          } else {
            log("Profile not found for email", { email: session.customer_email });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "invoice.paid": {
        const subscription = event.type === "invoice.paid" 
          ? (event.data.object as Stripe.Invoice).subscription as string
          : (event.data.object as Stripe.Subscription).id;
        
        log("Subscription event", { type: event.type, subscriptionId: subscription });
        
        // Récupérer les détails de la subscription
        const subDetails = await stripe.subscriptions.retrieve(subscription as string);
        const customer = await stripe.customers.retrieve(subDetails.customer as string);
        
        if (customer && !customer.deleted && customer.email) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("email", customer.email)
            .single();

          if (profile && subDetails.status === "active") {
            const { error } = await supabase
              .from("premium_users")
              .upsert({
                user_id: profile.user_id,
                granted_by: "stripe_webhook",
                notes: `Subscription ${event.type} - ${subscription}`,
                granted_at: new Date().toISOString(),
              }, {
                onConflict: "user_id"
              });

            if (error) {
              log("Error updating premium status", { error });
            } else {
              log("Premium status confirmed", { userId: profile.user_id });
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted":
      case "invoice.payment_failed": {
        const subscription = event.type === "invoice.payment_failed"
          ? (event.data.object as Stripe.Invoice).subscription as string
          : (event.data.object as Stripe.Subscription).id;
        
        log("Subscription cancellation/failure", { type: event.type, subscriptionId: subscription });
        
        const subDetails = await stripe.subscriptions.retrieve(subscription as string);
        const customer = await stripe.customers.retrieve(subDetails.customer as string);
        
        if (customer && !customer.deleted && customer.email) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("email", customer.email)
            .single();

          if (profile) {
            // Supprimer de premium_users
            const { error } = await supabase
              .from("premium_users")
              .delete()
              .eq("user_id", profile.user_id);

            if (error) {
              log("Error removing premium status", { error });
            } else {
              log("Premium status removed", { userId: profile.user_id });
            }
          }
        }
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[STRIPE-WEBHOOK] ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
