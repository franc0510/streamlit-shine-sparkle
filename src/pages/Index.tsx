import { Navbar } from "@/components/Navbar";
import { MatchCard } from "@/components/MatchCard";
import { Button } from "@/components/ui/button";
import { Lock, Check } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { parseScheduleCSV, parsePredictionsHistoryCSV, getTeamLogo, Match } from "@/lib/csvParser";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { PremiumGate } from "@/components/PremiumGate";
import { useMatchAccess } from "@/hooks/useMatchAccess";

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
const buildMatchUrl = (m: Match) => `/match/${slugify(m.tournament)}/${m.date}/${m.time}/${slugify(m.team1)}-vs-${slugify(m.team2)}?bo=${m.format}`;


const Index = () => {
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { isPremium, refreshSubscription } = useSubscription();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const loadMatches = async () => {
      const [upcoming, past] = await Promise.all([
        parseScheduleCSV(),
        parsePredictionsHistoryCSV()
      ]);
      setUpcomingMatches(upcoming);
      setPastMatches(past.slice(0, 6));
      setLoading(false);
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

  const calculateMinOdds = (proba: number) => {
    return (100 / proba).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement des matchs...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-3 sm:mb-4 bg-gradient-gaming bg-clip-text text-transparent">
            League of Legends
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-6 px-4">
            Prédictions basées sur des modèles statistiques avancés
          </p>
          
          {!isPremium && (
            <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-lg px-6 py-3 mb-8">
              <Lock className="w-5 h-5 text-accent" />
              <p className="text-sm text-foreground/90">
                Accès complet aux prédictions avec un{" "}
                <Link to="/auth" className="text-accent font-semibold hover:underline">
                  abonnement Premium
                </Link>
              </p>
            </div>
          )}
          
          {isPremium && (
            <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-lg px-6 py-3 mb-8">
              <Check className="w-5 h-5 text-primary" />
              <p className="text-sm text-foreground/90 font-semibold">
                Vous êtes membre Premium - Accès illimité
              </p>
            </div>
          )}
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold">
            Calendrier à venir
          </h2>
          {!isPremium && (
            <p className="text-sm text-muted-foreground">
              1 match gratuit • {upcomingMatches.length - 1} matchs Premium
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcomingMatches.map((match, index) => (
            <div key={index} className="relative animate-slide-up">
              {!isPremium && index > 0 && (
                <div className="absolute inset-0 backdrop-blur-sm bg-background/60 z-10 rounded-xl flex flex-col items-center justify-center gap-4 border-2 border-accent/30">
                  <Lock className="w-12 h-12 text-accent animate-glow-pulse" />
                  <div className="text-center px-4">
                    <p className="font-semibold text-lg mb-2">Contenu Premium</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Débloquez toutes les prédictions
                    </p>
                    <Link to="/auth">
                      <Button variant="default" size="sm" className="gap-2">
                        S'abonner
                        <Lock className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              <Link to={buildMatchUrl(match)} className="block">
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
          ))}
        </div>

        <div className="mt-16 mb-8">
          <h2 className="text-2xl font-display font-bold">
            Prédictions récentes
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Historique des dernières prédictions
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pastMatches.map((match, index) => (
            <Link key={index} to={buildMatchUrl(match)} className="block">
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
              Débloquez toutes les prédictions
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Accédez à l'ensemble de nos analyses, prédictions avancées et statistiques détaillées pour maximiser vos chances de succès.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                {user ? "S'abonner Premium" : "Commencer maintenant"}
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
