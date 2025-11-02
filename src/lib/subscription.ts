import { supabase } from "@/integrations/supabase/client";

export const PREMIUM_PRODUCT_ID = "prod_TIHVR9Og97Sd0W";
export const PREMIUM_PRICE_ID = "price_1SLgwBHrSrokKrOmY8qkwqpk";

export interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export const checkSubscription = async (): Promise<SubscriptionStatus> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { subscribed: false, product_id: null, subscription_end: null };
    }

    // First check if user has manual premium access
    const { data: premiumUser } = await supabase
      .from('premium_users')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (premiumUser) {
      return {
        subscribed: true,
        product_id: PREMIUM_PRODUCT_ID,
        subscription_end: null, // Manual premium has no expiration
      };
    }

    // If not manual premium, check Stripe subscription
    const { data, error } = await supabase.functions.invoke('check-subscription', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    
    return data as SubscriptionStatus;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { subscribed: false, product_id: null, subscription_end: null };
  }
};

export const createCheckoutSession = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('[createCheckoutSession] No session found');
    throw new Error('Vous devez être connecté pour vous abonner');
  }

  try {
    console.log('[createCheckoutSession] Session found, calling edge function');

    const invokePromise = supabase.functions.invoke('create-checkout', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const timeoutMs = 20000; // 20s timeout to avoid infinite loading
    const response = await Promise.race([
      invokePromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Le service de paiement ne répond pas (timeout). Réessayez dans quelques secondes.')),
        timeoutMs)
      ),
    ]);

    const { data, error } = response as { data?: { url?: string }; error?: { message?: string } };
    console.log('[createCheckoutSession] Edge function response:', { data, error });

    if (error) {
      console.error('[createCheckoutSession] Edge function error:', error);
      throw new Error(error.message || 'Erreur lors de la création de la session Stripe');
    }

    if (!data?.url) {
      console.error('[createCheckoutSession] No URL in response:', data);
      throw new Error("La session Stripe n'a pas retourné d'URL");
    }
    
    console.log('[createCheckoutSession] Checkout URL created:', data.url);
    return data.url;
  } catch (error) {
    console.error('[createCheckoutSession] Error creating checkout session:', error);
    if (error instanceof Error) throw error;
    throw new Error('Erreur inconnue lors de la création du paiement');
  }
};

export const openCustomerPortal = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    
    return data.url;
  } catch (error) {
    console.error('Error opening customer portal:', error);
    return null;
  }
};
