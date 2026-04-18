import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Calendar, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  STRIPE_PAYMENT_LINK_MONTHLY,
  STRIPE_PAYMENT_LINK_YEARLY,
  buildStripeLink,
} from "@/lib/subscription";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const features = t("pricing.features", { returnObjects: true }) as string[];

  const handleCheckout = (plan: "monthly" | "yearly") => {
    if (!user) {
      toast({
        title: t("pricing.loginRequiredTitle"),
        description: t("pricing.loginRequiredDesc"),
      });
      navigate("/auth?redirect=/pricing");
      return;
    }
    const base = plan === "monthly" ? STRIPE_PAYMENT_LINK_MONTHLY : STRIPE_PAYMENT_LINK_YEARLY;
    const url = buildStripeLink(base, user.email);
    window.location.href = url;
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
                  <span className="text-muted-foreground">/{t("pricing.monthly.perMonth")}</span>
                </div>
                <p className="text-sm text-amber-500 mt-2 font-semibold">{t("pricing.monthly.trialNote")}</p>
              </div>

              <Button onClick={() => handleCheckout("monthly")} className="w-full gap-2" size="lg">
                <Sparkles className="w-4 h-4" />
                {t("pricing.startTrial")}
              </Button>

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
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1 whitespace-nowrap">
                <Crown className="w-3.5 h-3.5" />
                {t("pricing.yearly.badge")}
              </Badge>

              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-bold">{t("pricing.yearly.title")}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{t("pricing.yearly.desc")}</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-bold text-muted-foreground/60 line-through decoration-2">
                    180€
                  </span>
                  <span className="text-4xl sm:text-5xl font-bold">149,90€</span>
                  <span className="text-muted-foreground">/{t("pricing.yearly.perYear")}</span>
                </div>
                <p className="text-sm text-amber-500 mt-2 font-semibold">{t("pricing.yearly.trialNote")}</p>
              </div>

              <Button onClick={() => handleCheckout("yearly")} className="w-full gap-2" size="lg" variant="default">
                <Crown className="w-4 h-4" />
                {t("pricing.startTrial")}
              </Button>

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
              <p className="font-semibold mb-1">🔒 {t("pricing.reassurance.secureTitle")}</p>
              <p className="text-muted-foreground text-xs">{t("pricing.reassurance.secureDesc")}</p>
            </Card>
            <Card className="p-4 bg-gradient-card border-border/50 text-sm text-center">
              <p className="font-semibold mb-1">⏱️ {t("pricing.reassurance.cancelTitle")}</p>
              <p className="text-muted-foreground text-xs">{t("pricing.reassurance.cancelDesc")}</p>
            </Card>
            <Card className="p-4 bg-gradient-card border-border/50 text-sm text-center">
              <p className="font-semibold mb-1">📊 {t("pricing.reassurance.algoTitle")}</p>
              <p className="text-muted-foreground text-xs">{t("pricing.reassurance.algoDesc")}</p>
            </Card>
          </div>

          {/* Hidden SEO copy */}
          <div className="sr-only">
            <h2>Abonnement pronostics esport League of Legends — PredictEsport</h2>
            <p>
              PredictEsport propose deux formules d'abonnement à son outil de prédictions esport pour
              League of Legends : un abonnement mensuel à 14,90€ et un abonnement annuel à 149,90€
              équivalent à 2 mois offerts (180€ - 30,10€ d'économie). Tous les abonnements incluent 7 jours
              d'essai gratuit pour tester l'algorithme de Machine Learning (LightGBM, Voting Ensemble, Random Forest)
              sur les compétitions LFL, LEC, LCK, LPL, LCS, MSI, Worlds, EMEA Masters, Arabian League, NLC, PRM,
              Ultraliga, Hitpoint Masters, LJL, CBLOL et LLA. L'objectif est d'identifier les value bets (EV positif)
              sur les cotes proposées par Pinnacle, Unibet, Polymarket et Stake. Subscription LoL betting tips,
              esports prediction subscription, pronosticos esports League of Legends, 英雄联盟预测订阅.
              Pronostic LoL gratuit 7 jours, pronostic League of Legends IA, pronostic esport LFL LEC LCK,
              pari LoL value bet expected value, abonnement pronostic esport mensuel annuel.
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              {t("pricing.alreadyAccount")}{" "}
              <Link to="/auth" className="text-primary hover:underline font-semibold">
                {t("nav.login")}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
