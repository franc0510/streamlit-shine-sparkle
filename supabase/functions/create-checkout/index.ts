// supabase/functions/create-checkout/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS pour que le front puisse appeler
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 🟣 on met TOUT en dur pour que ça marche même si Lovable ne passe pas les env
const STRIPE_SECRET_KEY_2 =
  "sk_test_51SLgmFH8e5UibDVFHRG5MixpaN0uSRfXpumKiz1yIeTyjHAFleywuplbTf6sohCfE9GWVIHN9ZLJDpfws8UvUKdE00Q4Mv5PpZ";

// ⚠️ mets ici le price que tu as créé dans Stripe (mode test)
const STRIPE_PRICE_ID = "price_1SLgwBHrSrokKrOmY8qkwqpk"; // remplace si tu en as un nouveau

// ⚠️ mets ici l’URL de ton site lovable
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

    // 1. récupérer l’utilisateur supabase
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log("No auth header");
      return new Response(JSON.stringify({ error: "No authorization header provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) {
      log("Auth error", userError);
      return new Response(JSON.stringify({ error: `Auth error: ${userError.message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    if (!user?.email) {
      log("No user email");
      return new Response(JSON.stringify({ error: "User not authenticated or missing email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // 2. Stripe (en dur)
    const stripe = new Stripe(STRIPE_SECRET_KEY_2, {
      apiVersion: "2024-06-20",
    });

    // 3. on essaye de réutiliser le customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") || FRONTEND_URL;

    // 4. création de la session
    const session = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : { customer_email: user.email }),
      mode: "subscription",
      line_items: [
        {
          price: STRIPE_PRICE_ID,
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
