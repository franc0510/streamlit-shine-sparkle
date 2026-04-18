import { Navbar } from "@/components/Navbar";
import { MatchCard } from "@/components/MatchCard";
import { MatchFilters } from "@/components/MatchFilters";
import { Faq } from "@/components/Faq";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lock, Check, Trophy, Gift, ChevronDown, Users, Zap, ShieldCheck, BarChart3, Sparkles, Info, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { parseScheduleCSV, parsePredictionsHistoryCSV, getTeamLogo, Match } from "@/lib/csvParser";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
const buildMatchUrl = (m: Match) => `/match/${slugify(m.tournament)}/${m.date}/${m.time}/${slugify(m.team1)}-vs-${slugify(m.team2)}?bo=${m.format}`;

const FREE_MATCHES_COUNT = 2;
const INITIAL_MATCHES_LIMIT = 10;
const MATCHES_INCREMENT = 10;

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
  const { isPremium, isTrialing, refreshSubscription } = useSubscription();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [matchesLimit, setMatchesLimit] = useState(INITIAL_MATCHES_LIMIT);

  // ROI form state
  const [roiEmail, setRoiEmail] = useState("");
  const [roiLoading, setRoiLoading] = useState(false);

  const handleRoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoiLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-roi-results", { body: { email: roiEmail } });
      if (error) throw error;
      toast({ title: t("about.roi.successTitle"), description: t("about.roi.successDescription") });
      setRoiEmail("");
    } catch {
      toast({ title: t("about.roi.errorTitle"), description: t("about.roi.errorDescription"), variant: "destructive" });
    } finally {
      setRoiLoading(false);
    }
  };


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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkPaymentReturn = async () => {
      const isReturnFromStripe = window.location.href.includes('stripe') ||
                                  searchParams.get('session_id') ||
                                  document.referrer.includes('stripe');
      if (isReturnFromStripe && user) {
        toast({ title: "Vérification du paiement...", description: "Nous vérifions votre abonnement." });
        await refreshSubscription();
        toast({ title: "Statut mis à jour", description: isPremium ? "Vous avez maintenant accès Premium!" : "Vérification en cours..." });
      }
    };
    if (user) checkPaymentReturn();
  }, [user, searchParams, refreshSubscription]);

  const leagues = useMemo(() => {
    return [...new Set(upcomingMatches.map(m => m.tournament))].sort();
  }, [upcomingMatches]);

  // IDs des matchs gratuits (les 2 premiers avec cotes, sinon 2 premiers)
  const freeMatchIds = useMemo(() => {
    if (upcomingMatches.length === 0) return new Set<string>();
    const withOdds = upcomingMatches.filter(m =>
      m.pinnacleOdds?.team1 !== null || m.unibetOdds?.team1 !== null || m.polymarketOdds?.team1 !== null || m.stakeOdds?.team1 !== null
    );
    const chosen = (withOdds.length >= FREE_MATCHES_COUNT ? withOdds : upcomingMatches).slice(0, FREE_MATCHES_COUNT);
    return new Set(chosen.map(m => `${m.tournament}-${m.date}-${m.time}-${m.team1}-${m.team2}`));
  }, [upcomingMatches]);

  const isFreeMatch = (match: Match) =>
    freeMatchIds.has(`${match.tournament}-${match.date}-${match.time}-${match.team1}-${match.team2}`);

  const filteredMatches = useMemo(() => {
    let filtered = upcomingMatches;

    if (isPremium && isTrialing) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const trialLimit = new Date(today);
      trialLimit.setDate(trialLimit.getDate() + 7);
      filtered = filtered.filter(m => {
        const md = parseMatchDate(m.date);
        if (!md) return true;
        md.setHours(0, 0, 0, 0);
        return md >= today && md <= trialLimit;
      });
    }

    if (selectedLeague !== "all") {
      filtered = filtered.filter(m => m.tournament === selectedLeague);
    }

    if (selectedDate !== "all") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
      filtered = filtered.filter(m => {
        const md = parseMatchDate(m.date);
        if (!md) return true;
        md.setHours(0, 0, 0, 0);
        switch (selectedDate) {
          case "today": return md.getTime() === today.getTime();
          case "tomorrow": return md.getTime() === tomorrow.getTime();
          case "week": return md >= today && md <= weekEnd;
          default: return true;
        }
      });
    }

    // Push free matches to the top for non-premium users
    if (!isPremium && freeMatchIds.size > 0) {
      const free = filtered.filter(m => isFreeMatch(m));
      const others = filtered.filter(m => !isFreeMatch(m));
      filtered = [...free, ...others];
    }

    return filtered;
  }, [upcomingMatches, selectedLeague, selectedDate, isPremium, isTrialing, freeMatchIds]);

  const visibleMatches = filteredMatches.slice(0, matchesLimit);
  const hasMoreMatches = filteredMatches.length > matchesLimit;

  const calculateMinOdds = (proba: number) => (100 / proba).toFixed(2);

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
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
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
        {/* HERO */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-2 bg-gradient-gaming bg-clip-text text-transparent">
            League of Legends
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-display font-semibold text-foreground/90 mb-3">
            Prédictions LoL & Pronostics Esport
          </p>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 px-4">
            LFL, LEC, LCK, LPL, LCS et 15+ autres leagues
          </p>

          {/* Social proof bar — full width, single line with icons */}
          <div className="max-w-5xl mx-auto bg-gradient-card border border-border/50 rounded-xl px-4 py-3 mb-6">
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-foreground/90">
              <li className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> {t('home.social.subscribers')}</li>
              <li className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary" /> {t('home.social.upToDate')}</li>
              <li className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> {t('home.social.freeTrial')}</li>
              <li className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-primary" /> {t('home.social.leagues')}</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> {t('home.social.secure')}</li>
            </ul>
          </div>

          {/* CTAs sous la barre */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <Link to="/pricing">
              <Button size="lg" className="gap-2">
                <Gift className="w-4 h-4" />
                {t('home.cta.freeTrial')}
              </Button>
            </Link>
            <Link to="/results">
              <Button size="lg" variant="outline" className="gap-2">
                <Trophy className="w-4 h-4" />
                {t('home.cta.seeResults')}
              </Button>
            </Link>
          </div>

          {isPremium && !isTrialing && (
            <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-lg px-6 py-3 mt-6">
              <Check className="w-5 h-5 text-primary" />
              <p className="text-sm text-foreground/90 font-semibold">{t('home.premiumMember')}</p>
            </div>
          )}
          {isPremium && isTrialing && (
            <div className="inline-flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-6 py-3 mt-6">
              <span className="text-sm font-semibold text-amber-500">
                🎁 {t('auth.trialBadge')} — {t('home.trialLimitInfo')}
              </span>
            </div>
          )}

          {/* SEO text — small/discreet */}
          <p className="sr-only">
            PredictEsport analyse chaque match de League of Legends pour vous donner les meilleures prédictions avant de parier.
            LFL, LEC, LCK, MSI, Worlds : retrouvez nos pronostics gratuits via notre IA, fruit de notre recherche.
          </p>
        </div>

        {/* Matches section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
            <h2 className="text-2xl font-display font-bold">{t('home.upcomingMatches')}</h2>
            {!isPremium && (
              <p className="text-xs text-muted-foreground">
                {FREE_MATCHES_COUNT} matchs gratuits • {Math.max(0, filteredMatches.length - FREE_MATCHES_COUNT)} matchs Premium
              </p>
            )}
          </div>

          {/* EV explanation — discreet */}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-4">
            <Info className="w-3 h-3" />
            <span>{t('home.evExplanation')}</span>
          </p>

          <MatchFilters
            leagues={leagues}
            selectedLeague={selectedLeague}
            onLeagueChange={setSelectedLeague}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        {visibleMatches.length === 0 ? (
          <div className="text-center py-12 bg-gradient-card border border-border/50 rounded-xl">
            <p className="text-muted-foreground">{t('home.noUpcomingMatches')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleMatches.map((match, index) => {
                const isFree = isFreeMatch(match);
                const shouldLock = !isPremium && !isFree;
                return (
                  <div key={index} className="relative animate-slide-up">
                    {shouldLock && (
                      <div className="absolute inset-0 backdrop-blur-md bg-background/80 z-10 rounded-xl flex flex-col items-center justify-center gap-4 border-2 border-accent/30">
                        <Lock className="w-12 h-12 text-accent animate-glow-pulse" />
                        <div className="text-center px-4">
                          <p className="font-semibold text-lg mb-2">{t('home.premiumContent')}</p>
                          <p className="text-sm text-muted-foreground mb-4">{t('home.unlockPredictions')}</p>
                          <Link to="/pricing">
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
                        team1={{ name: match.team1, logo: getTeamLogo(match.team1), winProbability: Math.round(match.proba1) }}
                        team2={{ name: match.team2, logo: getTeamLogo(match.team2), winProbability: Math.round(match.proba2) }}
                        minOdds={{ team1: parseFloat(calculateMinOdds(match.proba1)), team2: parseFloat(calculateMinOdds(match.proba2)) }}
                        pinnacleOdds={match.pinnacleOdds}
                        unibetOdds={match.unibetOdds}
                        polymarketOdds={match.polymarketOdds}
                        stakeOdds={match.stakeOdds}
                        recoPinnacle={match.recoPinnacle}
                        recoStake={match.recoStake}
                        bestBet={match.bestBet}
                      />
                    </Link>
                  </div>
                );
              })}
            </div>

            {hasMoreMatches && (
              <div className="mt-8 text-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setMatchesLimit(prev => prev + MATCHES_INCREMENT)}
                >
                  <ChevronDown className="w-4 h-4" />
                  {t('home.loadMore', { count: Math.min(MATCHES_INCREMENT, filteredMatches.length - matchesLimit), remaining: filteredMatches.length - matchesLimit })}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Recent predictions */}
        <div className="mt-16 mb-8">
          <h2 className="text-2xl font-display font-bold">{t('home.recentPredictions')}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t('home.recentPredictionsDesc')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pastMatches.map((match, index) => (
            <Link key={index} to={`${buildMatchUrl(match)}&proba1=${match.proba1}&proba2=${match.proba2}&ev1=${calculateMinOdds(match.proba1)}&ev2=${calculateMinOdds(match.proba2)}`} className="block">
              <MatchCard
                tournament={match.tournament}
                date={match.date}
                time={match.time}
                format={match.format}
                team1={{ name: match.team1, logo: getTeamLogo(match.team1), winProbability: Math.round(match.proba1) }}
                team2={{ name: match.team2, logo: getTeamLogo(match.team2), winProbability: Math.round(match.proba2) }}
                minOdds={{ team1: parseFloat(calculateMinOdds(match.proba1)), team2: parseFloat(calculateMinOdds(match.proba2)) }}
                pinnacleOdds={match.pinnacleOdds}
                unibetOdds={match.unibetOdds}
                polymarketOdds={match.polymarketOdds}
                stakeOdds={match.stakeOdds}
                recoPinnacle={match.recoPinnacle}
                recoStake={match.recoStake}
                bestBet={match.bestBet}
              />
            </Link>
          ))}
        </div>

        {!isPremium && (
          <div className="mt-12 text-center bg-gradient-card border border-border/50 rounded-xl p-8">
            <h3 className="text-2xl font-display font-bold mb-4">{t('home.premiumCta.title')}</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">{t('home.premiumCta.description')}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/pricing">
                <Button size="lg" className="gap-2">
                  <Gift className="w-4 h-4" />
                  Essayer 7 jours gratuitement
                </Button>
              </Link>
              <Link to="/results">
                <Button size="lg" variant="outline" className="gap-2">
                  <Trophy className="w-4 h-4" />
                  Voir nos résultats
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* FAQ */}
        <Faq />

        {/* Hidden SEO copy */}
        <div className="sr-only">
          <h2>Pronostics League of Legends propulsés par l'intelligence artificielle</h2>
          <p>
            PredictEsport est une plateforme de pronostics esport spécialisée dans League of Legends. Notre algorithme de
            Machine Learning (LightGBM, Voting Ensemble) analyse 10 ans de données compétitives — KDA, GPM, vision, drafts,
            winrates par patch — pour produire des prédictions LoL fiables sur la LFL, LEC, LCK, LPL, LCS, MSI, Worlds, EMEA Masters,
            Arabian League, NLC, PRM, Ultraliga, Hitpoint Masters, LJL, CBLOL, LLA et autres ligues régionales. Comparez
            instantanément les cotes Pinnacle, Unibet, Polymarket et Stake, identifiez les value bets (cotes sous-évaluées) et
            optimisez votre Expected Value (EV) sur le long terme. Démarrez gratuitement avec 7 jours d'essai sur l'abonnement
            mensuel à 14,90€ ou annuel à 149,90€ (2 mois offerts).
          </p>
        </div>
      </main>

      <footer className="border-t border-border mt-16 py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            <strong className="text-foreground">PredictEsport</strong> est la plateforme de référence pour les pronostics esport
            League of Legends, propulsée par un algorithme d'intelligence artificielle (Machine Learning). Grâce à notre modèle
            prédictif (LightGBM / Ensemble Learning), nous analysons en profondeur tout l'historique des matchs esportifs.
            Notre objectif est d'offrir une aide à la décision basée sur les statistiques (KDA, GPM, drafts, historique) pour
            optimiser vos analyses sur les paris esport.
          </p>
          <div className="mt-6 text-center text-xs text-muted-foreground/80">
            <p>&copy; 2025 PredictEsport. Tous droits réservés.</p>
            <p className="mt-2 max-w-3xl mx-auto">
              Les prédictions sont alimentées par PredictEsport. Le système utilise une approche purement mathématique basée sur
              les statistiques historiques des joueurs et des équipes pour estimer les probabilités de victoire en série. Il s'agit
              uniquement d'un outil d'analyse et de statistiques — il n'encourage pas les paris sur les matchs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
