// supabase/functions/customer-portal/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY =
  Deno.env.get("STRIPE_SECRET_KEY_2") ||
  "sk_test_51SLgmFH8e5UibDVFHRG5MixpaN0uSRfXpumKiz1yIeTyjHAFleywuplbTf6sohCfE9GWVIHN9ZLJDpfws8UvUKdE00Q4Mv5PpZ";

const FRONTEND_URL = "https://predict-esport.lovable.app";

const log = (step: string, details?: unknown) =>
  console.log(`[CUSTOMER-PORTAL] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    // Vérifier l'authentification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      throw new Error(`Auth error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or missing email");
    }

    log("User authenticated", { email: user.email });

    // Initialiser Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });

    // Trouver le customer Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this email");
    }

    const customerId = customers.data[0].id;
    log("Stripe customer found", { customerId });

    // Créer une session du portail client
    const origin = req.headers.get("origin") || FRONTEND_URL;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/auth`,
    });

    log("Portal session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CUSTOMER-PORTAL] ERROR", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
