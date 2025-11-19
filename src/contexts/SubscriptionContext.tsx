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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isPremium = subscriptionStatus.subscribed;

  const refreshSubscription = async () => {
    // Éviter les appels multiples simultanés
    if (isRefreshing) {
      console.log('[SubscriptionContext] Already refreshing, skipping...');
      return;
    }

    console.log('[SubscriptionContext] refreshSubscription called');
    setIsRefreshing(true);
    setIsLoading(true);
    
    try {
      console.log('[SubscriptionContext] Getting session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[SubscriptionContext] Session result:', { hasSession: !!session, userId: session?.user?.id });
      
      if (!session) {
        console.log('[SubscriptionContext] No session, setting to free');
        setSubscriptionStatus({
          subscribed: false,
          product_id: null,
          subscription_end: null,
        });
        return;
      }

      console.log('[SubscriptionContext] Calling checkSubscription...');
      const status = await checkSubscription();
      console.log('[SubscriptionContext] checkSubscription result:', status);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('[SubscriptionContext] Error:', error);
      setSubscriptionStatus({
        subscribed: false,
        product_id: null,
        subscription_end: null,
      });
    } finally {
      console.log('[SubscriptionContext] Refresh complete');
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('[SubscriptionContext] Initializing...');
    
    let mounted = true;

    // Check subscription on mount
    const initSubscription = async () => {
      if (mounted) {
        await refreshSubscription();
      }
    };
    initSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[SubscriptionContext] Auth state changed:', event);
        if (!mounted) return;
        
        if (event === 'SIGNED_IN') {
          // Attendre un peu pour éviter les appels simultanés
          setTimeout(() => {
            if (mounted) refreshSubscription();
          }, 500);
        } else if (event === 'SIGNED_OUT') {
          setSubscriptionStatus({
            subscribed: false,
            product_id: null,
            subscription_end: null,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refresh on window focus
  useEffect(() => {
    const onFocus = () => {
      console.log('[SubscriptionContext] Window focused');
      refreshSubscription();
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
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
