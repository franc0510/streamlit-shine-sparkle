import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthProvider] Initializing...");

    // 1) Charger immédiatement la session au montage
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[AuthProvider] Error getting session:", error);
      }
      console.log("[AuthProvider] Initial session loaded:", {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2) Écouter les changements d'état d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[AuthProvider] Auth state changed:", {
        event,
        hasSession: !!newSession,
        userId: newSession?.user?.id,
        email: newSession?.user?.email,
      });

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Si loading était encore à true, on le met à false
      if (loading) {
        setLoading(false);
      }
    });

    return () => {
      console.log("[AuthProvider] Cleaning up subscription");
      subscription.unsubscribe();
    };
  }, []);

  // Log l'état actuel à chaque changement (utile pour debug)
  useEffect(() => {
    console.log("[AuthProvider] Current state:", {
      loading,
      hasUser: !!user,
      hasSession: !!session,
      userId: user?.id,
      email: user?.email,
    });
  }, [user, session, loading]);

  return <AuthContext.Provider value={{ user, session, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
