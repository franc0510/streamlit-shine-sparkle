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
      console.error("[checkSubscription] edge error:", error);
      return { subscribed: false, product_id: null, subscription_end: null };
    }

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
 * @param userEmail - Email optionnel de l'utilisateur (pour système auth custom)
 * @returns L'URL de checkout Stripe ou null en cas d'erreur
 */

export const createCheckoutSession = async (email?: string): Promise<string | null> => {
  try {
    console.log("[createCheckoutSession] Using direct Stripe payment link");
    // Lien de paiement Stripe direct de test
    return "https://buy.stripe.com/test_cNibJ1aob00Hcr9dmWak000";
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
