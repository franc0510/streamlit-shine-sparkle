// src/lib/subscription.ts
import { supabase } from "@/integrations/supabase/client";

export const PREMIUM_PRODUCT_ID = "prod_TIHVR9Og97Sd0W";
// garde-le si tu l'utilises ailleurs, mais on ne s'y fie pas côté backend
export const PREMIUM_PRICE_ID = "price_1SLgwBHrSrokKrOmY8qkwqpk";

export interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export const checkSubscription = async (): Promise<SubscriptionStatus> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("[checkSubscription] no session -> not subscribed");
      return { subscribed: false, product_id: null, subscription_end: null };
    }

    // 1️⃣ accès manuel
    const { data: premiumUser, error: premiumErr } = await supabase
      .from("premium_users")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (premiumErr) {
      console.warn("[checkSubscription] premium_users error:", premiumErr);
    }

    if (premiumUser) {
      console.log("[checkSubscription] user has manual premium");
      return {
        subscribed: true,
        product_id: PREMIUM_PRODUCT_ID,
        subscription_end: null,
      };
    }

    // 2️⃣ appel edge function
    const { data, error } = await supabase.functions.invoke("check-subscription", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    console.log("[checkSubscription] edge response:", { data, error });

    if (error) {
      // cas: la fonction renvoie 500
      console.error("[checkSubscription] edge error:", error);
      return { subscribed: false, product_id: null, subscription_end: null };
    }

    // cas: la fonction a répondu 200 mais avec { error: "..."}
    if (data && typeof data === "object" && "error" in data) {
      console.error("[checkSubscription] edge returned error field:", data);
      return { subscribed: false, product_id: null, subscription_end: null };
    }

    return data as SubscriptionStatus;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { subscribed: false, product_id: null, subscription_end: null };
  }
};

/**
 * Appelle l'edge function "create-checkout" et renvoie l'URL stripe
 * - si tout va bien -> string (l'URL)
 * - si ça plante -> null (et tout est loggué)
 */
export const createCheckoutSession = async (): Promise<string | null> => {
  try {
    console.log("[createCheckoutSession] start");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("[createCheckoutSession] no session -> user not authenticated");
      return null;
    }

    console.log("[createCheckoutSession] calling edge function create-checkout…");

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    console.log("[createCheckoutSession] edge returned:", { data, error });

    // 1️⃣ erreur réseau / edge
    if (error) {
      console.error("[createCheckoutSession] edge function error:", error);
      return null;
    }

    // 2️⃣ la fonction a bien répondu mais avec { error: "..." }
    if (data && typeof data === "object" && "error" in data) {
      console.error("[createCheckoutSession] edge returned error object:", data);
      return null;
    }

    // 3️⃣ pas d'URL
    if (!data?.url) {
      console.error("[createCheckoutSession] no url in edge response:", data);
      return null;
    }

    console.log("[createCheckoutSession] success, url =", data.url);
    return data.url as string;
  } catch (error) {
    console.error("[createCheckoutSession] exception:", error);
    return null;
  }
};

/**
 * Ouvre le portal client Stripe
 */
export const openCustomerPortal = async (): Promise<string | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("[openCustomerPortal] no session");
      return null;
    }

    const { data, error } = await supabase.functions.invoke("customer-portal", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    console.log("[openCustomerPortal] edge response:", { data, error });

    if (error) {
      console.error("[openCustomerPortal] edge error:", error);
      return null;
    }

    if (!data?.url) {
      console.error("[openCustomerPortal] no url in response", data);
      return null;
    }

    return data.url as string;
  } catch (error) {
    console.error("Error opening customer portal:", error);
    return null;
  }
};
