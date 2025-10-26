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

export const createCheckoutSession = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    
    return data.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return null;
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
