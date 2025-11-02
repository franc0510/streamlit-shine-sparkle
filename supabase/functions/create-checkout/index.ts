import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CREATE-CHECKOUT] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    log("Function started");

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or missing email");

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY_2");
    if (!stripeSecret) throw new Error("STRIPE secret key not configured");

    const stripe = new Stripe(stripeSecret, { apiVersion: "2025-08-27.basil" });

    // Try to read priceId from body, then env
    let priceId: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      if (body && typeof body.priceId === 'string') {
        priceId = body.priceId;
      }
    } catch {}
    if (!priceId) {
      priceId = Deno.env.get("STRIPE_PRICE_ID") ?? null;
    }
    if (!priceId) throw new Error("No Stripe price configured (missing priceId)");

    const origin = req.headers.get("origin") || Deno.env.get("FRONTEND_URL") || "http://localhost:5173";

    // Create checkout session directly with customer_email
    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?subscription=success`,
      cancel_url: `${origin}/?subscription=cancelled`,
    });

    log("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CREATE-CHECKOUT] ERROR", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
