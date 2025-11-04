// supabase/functions/create-checkout/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS pour que le front puisse appeler
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-email",
};

// 🟣 on met TOUT en dur pour que ça marche même si Lovable ne passe pas les env
const STRIPE_SECRET_KEY_2 =
  "sk_test_51SLgmFH8e5UibDVFHRG5MixpaN0uSRfXpumKiz1yIeTyjHAFleywuplbTf6sohCfE9GWVIHN9ZLJDpfws8UvUKdE00Q4Mv5PpZ";

// ⚠️ mets ici le price que tu as créé dans Stripe (mode test)
const STRIPE_PRICE_ID = "price_1SLgwBHrSrokKrOmY8qkwqpk"; // remplace si tu en as un nouveau

// ⚠️ mets ici l'URL de ton site lovable
const FRONTEND_URL = "https://ton-site.lovable.app"; // remplace par ton vrai domaine lovable

const log = (step: string, details?: unknown) =>
  console.log(`[CREATE-CHECKOUT] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

serve(async (req) => {
  // prévol
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    // 1. Récupérer l'email utilisateur (soit via Supabase Auth, soit via header custom)
    let userEmail: string | null = null;

    // Tentative 1: via header custom x-user-email (pour systèmes sans Supabase Auth)
    const customEmailHeader = req.headers.get("x-user-email");
    if (customEmailHeader) {
      userEmail = customEmailHeader;
      log("Email from x-user-email header", { email: userEmail });
    }

    // Tentative 2: via Supabase Auth (si Authorization header présent)
    const authHeader = req.headers.get("Authorization");
    if (!userEmail && authHeader) {
      log("Trying Supabase Auth");
      const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      
      if (!userError && userData.user?.email) {
        userEmail = userData.user.email;
        log("Email from Supabase Auth", { email: userEmail });
      } else {
        log("Supabase Auth failed or no email", userError);
      }
    }

    // Vérification finale: on doit avoir un email d'une façon ou d'une autre
    if (!userEmail) {
      log("No email available from any source");
      return new Response(JSON.stringify({ error: "No user email provided (use x-user-email header or Supabase Auth)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 2. Stripe (en dur)
    const stripe = new Stripe(STRIPE_SECRET_KEY_2, {
      apiVersion: "2024-06-20",
    });

    // 3. on essaye de réutiliser le customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") || FRONTEND_URL;

    // Parse optional body to allow passing priceId from client
    let priceFromClient: string | undefined = undefined;
    try {
      const body = await req.json();
      if (body && typeof body.priceId === 'string') priceFromClient = body.priceId;
    } catch (_) {
      // no body provided
    }
    const priceToUse = priceFromClient || STRIPE_PRICE_ID;
    log("Using price", { priceToUse });

    // 4. création de la session
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

    log("Checkout session created", { sessionId: session.id });

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
