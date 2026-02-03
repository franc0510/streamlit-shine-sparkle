import { Navbar } from "@/components/Navbar";
import { MatchCard } from "@/components/MatchCard";
import { MatchFilters } from "@/components/MatchFilters";
import { Button } from "@/components/ui/button";
import { Lock, Check } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { parseScheduleCSV, parsePredictionsHistoryCSV, getTeamLogo, Match } from "@/lib/csvParser";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
const buildMatchUrl = (m: Match) => `/match/${slugify(m.tournament)}/${m.date}/${m.time}/${slugify(m.team1)}-vs-${slugify(m.team2)}?bo=${m.format}`;

// Parse date from format "DD mmm" (e.g., "15 janv.")
const parseMatchDate = (dateStr: string): Date | null => {
  const months: Record<string, number> = {
    'janv': 0, 'jan': 0, 'janv.': 0,
    'févr': 1, 'fev': 1, 'févr.': 1, 'feb': 1,
    'mars': 2, 'mar': 2,
    'avr': 3, 'avr.': 3, 'apr': 3,
    'mai': 4, 'may': 4,
    'juin': 5, 'jun': 5,
    'juil': 6, 'juil.': 6, 'jul': 6,
    'août': 7, 'aug': 7,
    'sept': 8, 'sept.': 8, 'sep': 8,
    'oct': 9, 'oct.': 9,
    'nov': 10, 'nov.': 10,
    'déc': 11, 'déc.': 11, 'dec': 11
  };
  
  const parts = dateStr.toLowerCase().trim().split(' ');
  if (parts.length < 2) return null;
  
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1].replace('.', '');
  const month = months[monthStr];
  
  if (isNaN(day) || month === undefined) return null;
  
  const now = new Date();
  return new Date(now.getFullYear(), month, day);
};

const Index = () => {
  const { t } = useTranslation();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const { isPremium, refreshSubscription } = useSubscription();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Filter states
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");

  useEffect(() => {
    const loadMatches = async () => {
      setLoadError(null);
      try {
        const [upcoming, past] = await Promise.all([
          parseScheduleCSV(),
          parsePredictionsHistoryCSV()
        ]);
        setUpcomingMatches(upcoming);
        setPastMatches(past.slice(0, 6));
      } catch (error: any) {
        console.error('Failed to load match data:', error);
        setLoadError(error.message || 'Failed to load match data');
        toast({
          title: t('matchDetails.error'),
          description: error.message || 'Failed to load match data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadMatches();

    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Rafraîchir l'abonnement au retour de Stripe
  useEffect(() => {
    const checkPaymentReturn = async () => {
      // Vérifier si on revient de Stripe (présence de paramètres success/cancel dans l'URL)
      const isReturnFromStripe = window.location.href.includes('stripe') || 
                                  searchParams.get('session_id') || 
                                  document.referrer.includes('stripe');
      
      if (isReturnFromStripe && user) {
        console.log("[Index] Retour de paiement détecté - rafraîchissement de l'abonnement");
        toast({
          title: "Vérification du paiement...",
          description: "Nous vérifions votre abonnement.",
        });
        
        await refreshSubscription();
        
        toast({
          title: "Statut mis à jour",
          description: isPremium ? "Vous avez maintenant accès Premium!" : "Vérification en cours...",
        });
      }
    };
    
    if (user) {
      checkPaymentReturn();
    }
  }, [user, searchParams, refreshSubscription]);

  // Get unique leagues from matches
  const leagues = useMemo(() => {
    const uniqueLeagues = [...new Set(upcomingMatches.map(m => m.tournament))];
    return uniqueLeagues.sort();
  }, [upcomingMatches]);

  // Identifier le PREMIER match global (celui qui sera accessible gratuitement)
  const freeMatchId = useMemo(() => {
    if (upcomingMatches.length === 0) return null;
    const firstMatch = upcomingMatches[0];
    // Créer un ID unique basé sur le match
    return `${firstMatch.tournament}-${firstMatch.date}-${firstMatch.time}-${firstMatch.team1}-${firstMatch.team2}`;
  }, [upcomingMatches]);

  // Fonction pour vérifier si un match est le match gratuit
  const isFreeMmatch = (match: Match) => {
    const matchId = `${match.tournament}-${match.date}-${match.time}-${match.team1}-${match.team2}`;
    return matchId === freeMatchId;
  };

  // Filter matches
  const filteredMatches = useMemo(() => {
    let filtered = upcomingMatches;
    
    // Filter by league
    if (selectedLeague !== "all") {
      filtered = filtered.filter(m => m.tournament === selectedLeague);
    }
    
    // Filter by date
    if (selectedDate !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      filtered = filtered.filter(m => {
        const matchDate = parseMatchDate(m.date);
        if (!matchDate) return true; // Keep matches we can't parse
        
        matchDate.setHours(0, 0, 0, 0);
        
        switch (selectedDate) {
          case "today":
            return matchDate.getTime() === today.getTime();
          case "tomorrow":
            return matchDate.getTime() === tomorrow.getTime();
          case "week":
            return matchDate >= today && matchDate <= weekEnd;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [upcomingMatches, selectedLeague, selectedDate]);

  const calculateMinOdds = (proba: number) => {
    return (100 / proba).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('home.loadingMatches')}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-8 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-destructive mb-4">{t('matchDetails.error')}</h2>
            <p className="text-muted-foreground mb-6">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-3 sm:mb-4 bg-gradient-gaming bg-clip-text text-transparent">
            {t('home.title')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-6 px-4">
            {t('home.subtitle')}
          </p>
          
          {!isPremium && (
            <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-lg px-6 py-3 mb-8">
              <Lock className="w-5 h-5 text-accent" />
              <p className="text-sm text-foreground/90">
                {t('home.fullAccess')}{" "}
                <Link to="/auth" className="text-accent font-semibold hover:underline">
                  {t('home.premiumSubscription')}
                </Link>
              </p>
            </div>
          )}
          
          {isPremium && (
            <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-lg px-6 py-3 mb-8">
              <Check className="w-5 h-5 text-primary" />
              <p className="text-sm text-foreground/90 font-semibold">
                {t('home.premiumMember')}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-4 py-2">
              <span className="text-sm font-semibold text-primary">
                {t('home.evExplanation')}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-2xl font-display font-bold">
              {t('home.upcomingMatches')}
            </h2>
            {!isPremium && (
              <p className="text-sm text-muted-foreground">
                {t('home.freeMatchInfo').replace('{count}', String(upcomingMatches.length - 1))}
              </p>
            )}
          </div>
          
          {/* Filters */}
          <MatchFilters
            leagues={leagues}
            selectedLeague={selectedLeague}
            onLeagueChange={setSelectedLeague}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 bg-gradient-card border border-border/50 rounded-xl">
            <p className="text-muted-foreground">{t('home.noUpcomingMatches')}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map((match, index) => {
              // Vérifier si ce match est le match gratuit (basé sur l'ID global, pas l'index filtré)
              const isFree = isFreeMmatch(match);
              const shouldLock = !isPremium && !isFree;
              
              return (
              <div key={index} className="relative animate-slide-up">
                {shouldLock && (
                  <div className="absolute inset-0 backdrop-blur-md bg-background/80 z-10 rounded-xl flex flex-col items-center justify-center gap-4 border-2 border-accent/30">
                    <Lock className="w-12 h-12 text-accent animate-glow-pulse" />
                    <div className="text-center px-4">
                      <p className="font-semibold text-lg mb-2">{t('home.premiumContent')}</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('home.unlockPredictions')}
                      </p>
                      <Link to="/auth">
                        <Button variant="default" size="sm" className="gap-2">
                          {t('home.subscribeButton')}
                          <Lock className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
                <Link to={`${buildMatchUrl(match)}&proba1=${match.proba1}&proba2=${match.proba2}&ev1=${calculateMinOdds(match.proba1)}&ev2=${calculateMinOdds(match.proba2)}`} className="block">
                  <MatchCard
                    tournament={match.tournament}
                    date={match.date}
                    time={match.time}
                    format={match.format}
                    team1={{
                      name: match.team1,
                      logo: getTeamLogo(match.team1),
                      winProbability: Math.round(match.proba1)
                    }}
                    team2={{
                      name: match.team2,
                      logo: getTeamLogo(match.team2),
                      winProbability: Math.round(match.proba2)
                    }}
                    minOdds={{
                      team1: parseFloat(calculateMinOdds(match.proba1)),
                      team2: parseFloat(calculateMinOdds(match.proba2))
                    }}
                  />
                </Link>
              </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 mb-8">
          <h2 className="text-2xl font-display font-bold">
            {t('home.recentPredictions')}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t('home.recentPredictionsDesc')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pastMatches.map((match, index) => (
            <Link key={index} to={`${buildMatchUrl(match)}&proba1=${match.proba1}&proba2=${match.proba2}&ev1=${calculateMinOdds(match.proba1)}&ev2=${calculateMinOdds(match.proba2)}`} className="block">
              <MatchCard
                tournament={match.tournament}
                date={match.date}
                time={match.time}
                format={match.format}
                team1={{
                  name: match.team1,
                  logo: getTeamLogo(match.team1),
                  winProbability: Math.round(match.proba1)
                }}
                team2={{
                  name: match.team2,
                  logo: getTeamLogo(match.team2),
                  winProbability: Math.round(match.proba2)
                }}
                minOdds={{
                  team1: parseFloat(calculateMinOdds(match.proba1)),
                  team2: parseFloat(calculateMinOdds(match.proba2))
                }}
              />
            </Link>
          ))}
        </div>

        {!isPremium && (
          <div className="mt-12 text-center bg-gradient-card border border-border/50 rounded-xl p-8">
            <h3 className="text-2xl font-display font-bold mb-4">
              {t('home.premiumCta.title')}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t('home.premiumCta.description')}
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                {user ? t('home.premiumCta.subscribePremium') : t('home.premiumCta.startNow')}
                <Lock className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PredictEsport. Tous droits réservés.</p>
          <p className="mt-2 text-xs max-w-3xl mx-auto">
            Les prédictions sont alimentées par PredictEsport. Le système utilise une approche purement mathématique basée sur les statistiques historiques des joueurs et des équipes pour estimer les probabilités de victoire en série. Il s'agit uniquement d'un outil d'analyse et de statistiques — il n'encourage pas les paris sur les matchs.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
