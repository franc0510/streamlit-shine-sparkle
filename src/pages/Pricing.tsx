import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Calendar, Gift, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STRIPE_PAYMENT_LINK_MONTHLY, STRIPE_PAYMENT_LINK_YEARLY } from "@/lib/subscription";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Pricing = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const features = [
    t("pricing.features.f1"),
    t("pricing.features.f2"),
    t("pricing.features.f3"),
    t("pricing.features.f4"),
    t("pricing.features.f5"),
    t("pricing.features.f6"),
    t("pricing.features.f7"),
    t("pricing.features.f8"),
  ];

  const handleSubscribe = (url: string) => (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      toast({
        title: t("pricing.loginRequiredTitle"),
        description: t("pricing.loginRequiredDesc"),
      });
      navigate("/auth");
      return;
    }
    // user logged in -> open Stripe in same tab to allow return flow
    window.location.href = url;
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14 animate-fade-in">
            <Badge className="mb-4 gap-1 bg-amber-500/15 text-amber-500 border-amber-500/30">
              <Gift className="w-3.5 h-3.5" />
              {t("pricing.trialBadge")}
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 bg-gradient-gaming bg-clip-text text-transparent">
              {t("pricing.title")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              {t("pricing.subtitle")}
            </p>
            {!user && (
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
                <LogIn className="w-4 h-4" />
                <span>{t("pricing.accountRequiredHint")}</span>
              </div>
            )}
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Mensuel */}
            <Card className="p-6 sm:p-8 bg-gradient-card border-border/50 hover:border-primary/30 transition-all relative">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-bold">{t("pricing.monthly.title")}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{t("pricing.monthly.desc")}</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold">14,90€</span>
                  <span className="text-muted-foreground">{t("pricing.perMonth")}</span>
                </div>
                <p className="text-sm text-amber-500 mt-2 font-semibold">{t("pricing.monthly.trialNote")}</p>
              </div>

              <a href={STRIPE_PAYMENT_LINK_MONTHLY} onClick={handleSubscribe(STRIPE_PAYMENT_LINK_MONTHLY)} className="block">
                <Button className="w-full gap-2" size="lg">
                  <Sparkles className="w-4 h-4" />
                  {t("pricing.startTrialBtn")}
                </Button>
              </a>

              <ul className="mt-6 space-y-2.5 text-sm">
                {features.slice(0, 6).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Annuel — Best value */}
            <Card className="p-6 sm:p-8 bg-gradient-card border-2 border-primary/60 relative shadow-elegant">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1">
                <Crown className="w-3.5 h-3.5" />
                {t("pricing.yearly.badge")}
              </Badge>

              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-bold">{t("pricing.yearly.title")}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{t("pricing.yearly.desc")}</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl text-muted-foreground line-through">180€</span>
                  <span className="text-4xl sm:text-5xl font-bold">149,90€</span>
                  <span className="text-muted-foreground">{t("pricing.perYear")}</span>
                </div>
                <p className="text-sm text-green-500 mt-1 font-semibold">{t("pricing.yearly.savingsNote")}</p>
                <p className="text-sm text-amber-500 mt-2 font-semibold">{t("pricing.yearly.trialNote")}</p>
              </div>

              <a href={STRIPE_PAYMENT_LINK_YEARLY} onClick={handleSubscribe(STRIPE_PAYMENT_LINK_YEARLY)} className="block">
                <Button className="w-full gap-2" size="lg" variant="default">
                  <Crown className="w-4 h-4" />
                  {t("pricing.startTrialBtn")}
                </Button>
              </a>

              <ul className="mt-6 space-y-2.5 text-sm">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Reassurance row */}
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            <Card className="p-4 bg-gradient-card border-border/50 text-sm text-center">
              <p className="font-semibold mb-1">🔒 {t("pricing.reassurance.secure")}</p>
              <p className="text-muted-foreground text-xs">{t("pricing.reassurance.secureDesc")}</p>
            </Card>
            <Card className="p-4 bg-gradient-card border-border/50 text-sm text-center">
              <p className="font-semibold mb-1">⏱️ {t("pricing.reassurance.cancel")}</p>
              <p className="text-muted-foreground text-xs">{t("pricing.reassurance.cancelDesc")}</p>
            </Card>
            <Card className="p-4 bg-gradient-card border-border/50 text-sm text-center">
              <p className="font-semibold mb-1">📊 {t("pricing.reassurance.algo")}</p>
              <p className="text-muted-foreground text-xs">{t("pricing.reassurance.algoDesc")}</p>
            </Card>
          </div>

          {/* Hidden SEO copy */}
          <div className="sr-only">
            <h2>Abonnement pronostics esport League of Legends — mensuel et annuel</h2>
            <p>
              PredictEsport propose deux formules d'abonnement à son outil de prédictions esport pour League of Legends :
              un abonnement mensuel à 14,90€ (au lieu de 20€) et un abonnement annuel à 149,90€ au lieu de 180€,
              équivalent à 2 mois offerts. Tous les abonnements incluent 7 jours d'essai gratuit pour tester
              l'algorithme de Machine Learning (LightGBM, Voting Ensemble) sur les compétitions LFL, LEC, LCK, LPL, LCS,
              MSI, Worlds, EMEA Masters, Arabian League, NLC, PRM, Ultraliga, Hitpoint Masters, LJL, CBLOL, LLA et autres.
              L'objectif est d'identifier les value bets (EV positif) sur les cotes proposées par Pinnacle, Unibet,
              Polymarket et Stake. Création de compte obligatoire avant paiement Stripe pour relier votre abonnement à
              votre profil PredictEsport. Paiement sécurisé par carte bancaire, Apple Pay et Google Pay. Résiliation en
              un clic à tout moment depuis votre espace personnel. Idéal pour parieurs esport, fans LoL, analystes Worlds
              et MSI, communauté LFL, joueurs compétitifs, créateurs de contenu et data scientists passionnés.
            </p>
            <h3>Tarifs détaillés et avantages premium</h3>
            <p>
              Choisir l'abonnement annuel (149,90€) permet d'économiser 30,10€ par an par rapport au cumul mensuel
              (12 × 14,90€ = 178,80€), soit environ deux mois offerts. Les deux formules donnent accès illimité aux
              prédictions IA, à la comparaison automatique des cotes Pinnacle, Unibet, Polymarket et Stake, à
              l'identification des value bets à EV positif, aux statistiques détaillées par joueur (KDA, GPM, vision,
              winrate par champion, par patch et par rôle Top, Jungle, Mid, ADC, Support), aux notifications avant
              chaque match, ainsi qu'à un support prioritaire par email et Discord.
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              {t("pricing.haveAccount")}{" "}
              <Link to="/auth" className="text-primary hover:underline font-semibold">
                {t("pricing.loginLink")}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
