import { useState, useEffect } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";

const FREE_MATCH_LIMIT = 1;
const VIEWED_MATCHES_KEY = "predictesport_viewed_matches";

interface ViewedMatch {
  id: string;
  viewedAt: number;
}

/**
 * Hook pour gérer l'accès aux matchs selon le statut premium
 * 
 * FREE users : peuvent voir 1 match
 * PREMIUM users : accès illimité
 */
export const useMatchAccess = () => {
  const { isPremium } = useSubscription();
  const [viewedMatches, setViewedMatches] = useState<ViewedMatch[]>([]);

  // Charger les matchs consultés depuis le localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEWED_MATCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ViewedMatch[];
        // Garder seulement les matchs des dernières 24h
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recent = parsed.filter((m) => m.viewedAt > oneDayAgo);
        setViewedMatches(recent);
        if (recent.length !== parsed.length) {
          localStorage.setItem(VIEWED_MATCHES_KEY, JSON.stringify(recent));
        }
      }
    } catch (error) {
      console.error("Error loading viewed matches:", error);
    }
  }, []);

  /**
   * Marquer un match comme consulté
   */
  const markMatchAsViewed = (matchId: string) => {
    const newMatch: ViewedMatch = {
      id: matchId,
      viewedAt: Date.now(),
    };

    setViewedMatches((prev) => {
      // Éviter les doublons
      if (prev.some((m) => m.id === matchId)) {
        return prev;
      }
      const updated = [...prev, newMatch];
      localStorage.setItem(VIEWED_MATCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * Vérifier si l'utilisateur peut voir un match
   */
  const canViewMatch = (matchId?: string): boolean => {
    // Premium = accès illimité
    if (isPremium) return true;

    // Si matchId fourni et déjà consulté, autoriser
    if (matchId && viewedMatches.some((m) => m.id === matchId)) {
      return true;
    }

    // FREE users : vérifier la limite
    return viewedMatches.length < FREE_MATCH_LIMIT;
  };

  /**
   * Vérifier si un match spécifique a déjà été consulté
   */
  const isMatchViewed = (matchId: string): boolean => {
    return viewedMatches.some((m) => m.id === matchId);
  };

  /**
   * Réinitialiser le compteur (admin uniquement, ou pour debug)
   */
  const resetViewedMatches = () => {
    setViewedMatches([]);
    localStorage.removeItem(VIEWED_MATCHES_KEY);
  };

  return {
    viewedCount: viewedMatches.length,
    freeLimit: FREE_MATCH_LIMIT,
    canViewMatch,
    isMatchViewed,
    markMatchAsViewed,
    resetViewedMatches,
    isPremium,
  };
};
