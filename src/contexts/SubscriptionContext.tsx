import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkSubscription, SubscriptionStatus, PREMIUM_PRODUCT_ID } from '@/lib/subscription';

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus;
  isLoading: boolean;
  isPremium: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    product_id: null,
    subscription_end: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const isPremium = subscriptionStatus.subscribed;

  const refreshSubscription = async () => {
    console.log('[SubscriptionContext] refreshSubscription called');
    
    // Ne pas appeler check-subscription si pas de session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('[SubscriptionContext] No session, skipping refresh');
      setSubscriptionStatus({
        subscribed: false,
        product_id: null,
        subscription_end: null,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const status = await checkSubscription();
      console.log('[SubscriptionContext] checkSubscription returned:', status);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('[SubscriptionContext] Error refreshing subscription:', error);
      // En cas d'erreur, ne pas bloquer, juste mettre non-premium
      setSubscriptionStatus({
        subscribed: false,
        product_id: null,
        subscription_end: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[SubscriptionContext] Initializing...');
    // Check subscription on mount
    refreshSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[SubscriptionContext] Auth state changed:', event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshSubscription();
        } else if (event === 'SIGNED_OUT') {
          setSubscriptionStatus({
            subscribed: false,
            product_id: null,
            subscription_end: null,
          });
        }
      }
    );

    // Refresh every 15 seconds when user is active
    const interval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          refreshSubscription();
        }
      });
    }, 15000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Extra: refresh on window focus/visibility change
  useEffect(() => {
    const onFocus = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          refreshSubscription();
        }
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        isLoading,
        isPremium,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
