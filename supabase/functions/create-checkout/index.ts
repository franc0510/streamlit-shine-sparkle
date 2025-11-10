// supabase/functions/create-checkout/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-email",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CREATE-CHECKOUT] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY_2") || Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_ID") || "price_1SMsMzH8e5UibDVFCDSViYXR";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://preview--predict-esport.lovable.app";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    log("Function started");

    // 1) Essaye via Authorization (si un jour tu actives Supabase Auth)
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
        const { data: userData } = await supabase.auth.getUser(token);
        userEmail = userData?.user?.email ?? null;
        log("Auth via Supabase OK", { email: userEmail });
      } catch (e) {
        log("Auth via Supabase FAIL", { e: String(e) });
      }
    }

    // 2) Fallback SANS auth: email passé par le front
    if (!userEmail) {
      userEmail = req.headers.get("x-user-email");
      log("Fallback x-user-email", { email: userEmail });
    }

    // 3) Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    // Réutiliser customer si on a un email
    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      customerId = customers.data[0]?.id;
      log("Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || FRONTEND_URL;

    const session = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : {}),
      ...(userEmail && !customerId ? { customer_email: userEmail } : {}),
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
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
