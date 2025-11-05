import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-email",
};

const STRIPE_PRICE_ID = "price_1QkCCTKvdwCbAxfXnH9zn1DT"; // Your actual price ID

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1) On tente via Authorization (si un jour tu actives Supabase Auth)
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
        const { data: userData } = await supabase.auth.getUser(token);
        userEmail = userData?.user?.email ?? null;
      } catch {}
    }

    // 2) Fallback sans auth: header custom depuis le front
    if (!userEmail) {
      userEmail = req.headers.get("x-user-email");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Réutiliser le customer si email connu
    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      customerId = customers.data[0]?.id;
    }

    const origin = req.headers.get("origin") || "http://localhost:8080";

    const session = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : {}),
      ...(userEmail && !customerId ? { customer_email: userEmail } : {}),
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/?subscription=success`,
      cancel_url: `${origin}/?subscription=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
