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

export interface DiagnosticStep {
  name: string;
  status: "pending" | "success" | "error" | "loading";
  message?: string;
  details?: string;
}

export const createCheckoutSession = async (
  onDiagnostic?: (steps: DiagnosticStep[]) => void,
  accessToken?: string
): Promise<string> => {
  const diagnostics: DiagnosticStep[] = [
    { name: "1. Vérification de la session utilisateur", status: "loading" },
    { name: "2. Appel de la fonction Stripe", status: "pending" },
    { name: "3. Création de la session de paiement", status: "pending" },
    { name: "4. Récupération de l'URL de redirection", status: "pending" },
  ];

  const updateDiagnostic = (index: number, update: Partial<DiagnosticStep>) => {
    diagnostics[index] = { ...diagnostics[index], ...update };
    onDiagnostic?.(diagnostics);
  };

  try {
    // Étape 1: Vérifier la session
    let token = accessToken;
    let email: string | undefined;

    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        updateDiagnostic(0, {
          status: "error",
          message: "Aucune session active trouvée",
          details: "Vous devez être connecté pour vous abonner. Essayez de vous déconnecter puis vous reconnecter.",
        });
        throw new Error('Vous devez être connecté pour vous abonner');
      }
      token = session.access_token;
      email = session.user.email ?? undefined;
    }

    updateDiagnostic(0, {
      status: "success",
      message: email ? `Session active pour ${email}` : "Session active",
    });

    // Étape 2: Appeler la fonction edge
    updateDiagnostic(1, { status: "loading" });
    console.log('[createCheckoutSession] Calling edge function with token');

    const invokePromise = supabase.functions.invoke('create-checkout', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const timeoutMs = 20000;
    const response = await Promise.race([
      invokePromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => {
          updateDiagnostic(1, {
            status: "error",
            message: "Timeout de 20 secondes dépassé",
            details: "La fonction Stripe ne répond pas. Le service pourrait être temporairement indisponible.",
          });
          reject(new Error('Le service de paiement ne répond pas (timeout).'));
        }, timeoutMs)
      ),
    ]);

    const { data, error } = response as { data?: { url?: string }; error?: { message?: string } };
    
    if (error) {
      updateDiagnostic(1, {
        status: "error",
        message: "Erreur renvoyée par la fonction Stripe",
        details: error.message || "Erreur inconnue",
      });
      throw new Error(error.message || 'Erreur lors de la création de la session Stripe');
    }

    updateDiagnostic(1, {
      status: "success",
      message: "Fonction Stripe appelée avec succès",
    });

    // Étape 3: Vérifier la réponse
    updateDiagnostic(2, { status: "loading" });

    if (!data) {
      updateDiagnostic(2, {
        status: "error",
        message: "Aucune donnée retournée",
        details: "La fonction a répondu mais sans données. Vérifiez la configuration Stripe.",
      });
      throw new Error("Aucune donnée retournée par Stripe");
    }

    updateDiagnostic(2, {
      status: "success",
      message: "Données reçues de Stripe",
    });

    // Étape 4: Vérifier l'URL
    updateDiagnostic(3, { status: "loading" });

    if (!data.url) {
      updateDiagnostic(3, {
        status: "error",
        message: "URL de paiement manquante",
        details: "La session Stripe a été créée mais l'URL de redirection est manquante. Contactez le support.",
      });
      throw new Error("URL de paiement manquante");
    }

    updateDiagnostic(3, {
      status: "success",
      message: "URL de redirection obtenue",
    });

    console.log('[createCheckoutSession] Checkout URL:', data.url);
    return data.url;
  } catch (error) {
    console.error('[createCheckoutSession] Error:', error);
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
