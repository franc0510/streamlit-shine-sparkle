// src/lib/subscription.ts
import { supabase } from "@/integrations/supabase/client";

export const PREMIUM_PRODUCT_ID = "prod_TJVNCl5roSeR21";
export const PREMIUM_PRICE_ID = "prod_TJVNCl5roSeR21";

export interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export type DiagnosticStep = {
  name: string;
  status: "pending" | "success" | "error" | "loading";
  message?: string;
  details?: string;
};

export const checkSubscription = async (): Promise<SubscriptionStatus> => {
  try {
    console.log("[checkSubscription] START");
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("[checkSubscription] no session -> not subscribed");
      return { subscribed: false, product_id: null, subscription_end: null };
    }

    console.log("[checkSubscription] session found, user_id:", session.user.id);

    // 1️⃣ Vérifier accès manuel dans premium_users
    console.log("[checkSubscription] Checking premium_users table...");
    const { data: premiumUser, error: premiumErr } = await supabase
      .from("premium_users")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (premiumErr) {
      console.warn("[checkSubscription] premium_users error:", premiumErr);
    } else {
      console.log("[checkSubscription] premium_users query result:", premiumUser);
    }

    if (premiumUser) {
      console.log("[checkSubscription] ✅ User has manual premium access");
      return {
        subscribed: true,
        product_id: PREMIUM_PRODUCT_ID,
        subscription_end: null,
      };
    }

    // 2️⃣ Si pas dans premium_users, vérifier Stripe via edge function
    console.log("[checkSubscription] Not in premium_users, calling check-subscription edge function...");
    const { data, error } = await supabase.functions.invoke("check-subscription", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {},
    });

    console.log("[checkSubscription] edge response:", { data, error });

    if (error) {
      console.error("[checkSubscription] edge error:", error);
      return { subscribed: false, product_id: null, subscription_end: null };
    }

    if (data && typeof data === "object" && "error" in data) {
      console.error("[checkSubscription] edge returned error field:", data);
      return { subscribed: false, product_id: null, subscription_end: null };
    }

    return data as SubscriptionStatus;
  } catch (error) {
    console.error("[checkSubscription] EXCEPTION:", error);
    return { subscribed: false, product_id: null, subscription_end: null };
  }
};

/**
 * Appelle l'edge function "create-checkout" et renvoie l'URL stripe
 * @param userEmail - Email optionnel de l'utilisateur (pour système auth custom)
 * @returns L'URL de checkout Stripe ou null en cas d'erreur
 */

export const createCheckoutSession = async (email?: string): Promise<string | null> => {
  try {
    console.log("[createCheckoutSession] Calling create-checkout edge function");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.error("[createCheckoutSession] NO session - user must be logged in");
      return null;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };

    if (email) {
      headers["x-user-email"] = email;
    }

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      headers,
      body: {},
    });

    console.log("[createCheckoutSession] Response:", { hasData: !!data, hasError: !!error, dataUrl: data?.url });

    if (error) {
      console.error("[createCheckoutSession] Edge function error:", error);
      return null;
    }

    if (!data?.url) {
      console.error("[createCheckoutSession] No URL in response");
      return null;
    }

    return data.url as string;
  } catch (e) {
    console.error("[createCheckoutSession] exception:", e);
    return null;
  }
};

/**
 * Ouvre le portal client Stripe
 * @returns L'URL du portail client ou null en cas d'erreur
 */
export const openCustomerPortal = async (): Promise<string | null> => {
  try {
    console.log("[openCustomerPortal] start");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.error("[openCustomerPortal] NO session - user must be logged in");
      return null;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };

    console.log("[openCustomerPortal] Calling edge function...");

    const { data, error } = await supabase.functions.invoke("customer-portal", {
      headers,
      body: {},
    });

    console.log("[openCustomerPortal] Response:", {
      hasData: !!data,
      hasError: !!error,
      dataUrl: data?.url,
    });

    if (error) {
      console.error("[openCustomerPortal] Edge function error:", error);
      return null;
    }

    if (!data?.url) {
      console.error("[openCustomerPortal] No URL in response");
      return null;
    }

    console.log("[openCustomerPortal] Success! URL:", data.url);
    return data.url as string;
  } catch (error) {
    console.error("[openCustomerPortal] Exception:", error);
    return null;
  }
};
