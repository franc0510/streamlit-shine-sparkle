// supabase/functions/create-checkout/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-email",
};

// Clé Stripe en dur (à remplacer par variable d'environnement en production)
const STRIPE_SECRET_KEY =
  Deno.env.get("STRIPE_SECRET_KEY_2") ||
  "sk_test_51SLgmFH8e5UibDVFHRG5MixpaN0uSRfXpumKiz1yIeTyjHAFleywuplbTf6sohCfE9GWVIHN9ZLJDpfws8UvUKdE00Q4Mv5PpZ";

// Price ID de votre abonnement Stripe
const STRIPE_PRICE_ID = "price_1SLgwBHrSrokKrOmY8qkwqpk";

// URL de votre site (IMPORTANT: remplacez par votre vraie URL)
const FRONTEND_URL = "https://predict-esport.lovable.app";

const log = (step: string, details?: unknown) =>
  console.log(`[CREATE-CHECKOUT] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    // 1. Récupérer l'email utilisateur
    let userEmail: string | null = null;

    // Tentative 1: via header custom x-user-email
    const customEmailHeader = req.headers.get("x-user-email");
    if (customEmailHeader) {
      userEmail = customEmailHeader;
      log("Email from x-user-email header", { email: userEmail });
    }

    // Tentative 2: via Supabase Auth
    const authHeader = req.headers.get("Authorization");
    if (!userEmail && authHeader) {
      log("Trying Supabase Auth");
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

      if (!supabaseUrl || !supabaseKey) {
        log("Missing Supabase credentials");
      } else {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabase.auth.getUser(token);

        if (!userError && userData.user?.email) {
          userEmail = userData.user.email;
          log("Email from Supabase Auth", { email: userEmail });
        } else {
          log("Supabase Auth failed", userError?.message);
        }
      }
    }

    // Vérification: on doit avoir un email
    if (!userEmail) {
      log("No email available");
      return new Response(
        JSON.stringify({ error: "No user email provided (use x-user-email header or Supabase Auth)" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // 2. Initialiser Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });

    // 3. Vérifier si le client existe déjà
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    const customerId = customers.data[0]?.id;
    log("Customer lookup", { customerId: customerId || "new" });

    // 4. Obtenir l'origine pour les URLs de redirection
    const origin = req.headers.get("origin") || FRONTEND_URL;
    log("Using origin", { origin });

    // 5. Vérifier si un priceId est fourni dans le body
    let priceToUse = STRIPE_PRICE_ID;
    try {
      const body = await req.json();
      if (body && typeof body.priceId === "string") {
        priceToUse = body.priceId;
      }
    } catch {
      // Pas de body, on utilise le price par défaut
    }
    log("Using price", { priceId: priceToUse });

    // 6. Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : { customer_email: userEmail }),
      mode: "subscription",
      line_items: [
        {
          price: priceToUse,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?subscription=success`,
      cancel_url: `${origin}/?subscription=cancelled`,
    });

    log("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-CHECKOUT] ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
