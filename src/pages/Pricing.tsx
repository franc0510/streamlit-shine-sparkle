import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Calendar, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STRIPE_PAYMENT_LINK } from "@/lib/subscription";
import { Link } from "react-router-dom";

const features = [
  "Accès illimité à toutes les prédictions LoL",
  "Couverture des 15+ leagues majeures (LFL, LEC, LCK, LPL, LCS, MSI, Worlds...)",
  "Recommandations IA basées sur LightGBM & Voting Ensemble",
  "Identification automatique des value bets (EV positif)",
  "Comparaison des cotes Pinnacle, Unibet, Polymarket, Stake",
  "Statistiques détaillées par joueur et par équipe",
  "Notifications des nouveaux matchs et opportunités",
  "Support prioritaire par email et Discord",
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14 animate-fade-in">
            <Badge className="mb-4 gap-1 bg-amber-500/15 text-amber-500 border-amber-500/30">
              <Gift className="w-3.5 h-3.5" />
              7 jours d'essai gratuit
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 bg-gradient-gaming bg-clip-text text-transparent">
              Choisissez votre formule PredictEsport
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Accédez à toutes les prédictions League of Legends générées par notre IA. Annulation possible à tout moment.
            </p>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Mensuel */}
            <Card className="p-6 sm:p-8 bg-gradient-card border-border/50 hover:border-primary/30 transition-all relative">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-bold">Mensuel</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Facturation chaque mois, sans engagement.</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold">14,90€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <p className="text-sm text-amber-500 mt-2 font-semibold">7 jours gratuits, puis 14,90€/mois</p>
              </div>

              <a href={STRIPE_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full gap-2" size="lg">
                  <Sparkles className="w-4 h-4" />
                  Démarrer l'essai gratuit
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
                Meilleure offre · 2 mois offerts
              </Badge>

              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-bold">Annuel</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Économisez 28,90€ par an grâce à l'abonnement annuel.</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold">149,90€</span>
                  <span className="text-muted-foreground">/an</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">soit ~12,49€/mois</p>
                <p className="text-sm text-amber-500 mt-2 font-semibold">7 jours gratuits, puis 149,90€/an</p>
              </div>

              <a href={STRIPE_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full gap-2" size="lg" variant="default">
                  <Crown className="w-4 h-4" />
                  Démarrer l'essai gratuit
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
              <p className="font-semibold mb-1">🔒 Paiement sécurisé Stripe</p>
              <p className="text-muted-foreground text-xs">Carte bancaire, Apple Pay, Google Pay</p>
            </Card>
            <Card className="p-4 bg-gradient-card border-border/50 text-sm text-center">
              <p className="font-semibold mb-1">⏱️ Résiliation en 1 clic</p>
              <p className="text-muted-foreground text-xs">Aucun engagement, gérez via votre espace</p>
            </Card>
            <Card className="p-4 bg-gradient-card border-border/50 text-sm text-center">
              <p className="font-semibold mb-1">📊 Algorithme entraîné</p>
              <p className="text-muted-foreground text-xs">10 ans de données compétitives LoL</p>
            </Card>
          </div>

          {/* Hidden SEO copy */}
          <div className="sr-only">
            <h2>Abonnement pronostics esport League of Legends</h2>
            <p>
              PredictEsport propose deux formules d'abonnement à son outil de prédictions esport pour
              League of Legends : un abonnement mensuel à 14,90€ et un abonnement annuel à 149,90€
              équivalent à deux mois offerts. Tous les abonnements incluent 7 jours d'essai gratuit pour tester
              l'algorithme de Machine Learning (LightGBM, Voting Ensemble) sur les compétitions LFL, LEC, LCK,
              LPL, LCS, MSI et Worlds. L'objectif est d'identifier les value bets (EV positif) sur les cotes
              proposées par Pinnacle, Unibet, Polymarket et Stake.
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Vous avez déjà un compte ?{" "}
              <Link to="/auth" className="text-primary hover:underline font-semibold">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
