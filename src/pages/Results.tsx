import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";

const Results = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Résultats & performance IA — PredictEsport"
        description="Performances vérifiables de notre modèle de Machine Learning : Accuracy, AUC, LogLoss et ROI sur les Worlds 2025."
        path="/results"
      />
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 bg-gradient-gaming bg-clip-text text-transparent">
              {t("results.title")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              {t("results.subtitle")}
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-8 text-center">{t("about.performance.title")}</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 bg-gradient-card border-border/50">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-display font-bold mb-3">{t("about.performance.summary.title")}</h3>
                <div className="space-y-2 text-muted-foreground text-sm">
                  <p>✓ {t("about.performance.summary.accuracy")}</p>
                  <p>✓ {t("about.performance.summary.auc")}</p>
                  <p>✓ {t("about.performance.summary.logloss")}</p>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card border-border/50">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-display font-bold mb-3">{t("about.performance.accuracy.title")}</h3>
                <p className="text-muted-foreground">{t("about.performance.accuracy.desc1")}</p>
                <p className="text-muted-foreground mt-2">{t("about.performance.accuracy.desc2")}</p>
              </Card>
              <Card className="p-6 bg-gradient-card border-border/50">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-display font-bold mb-3">{t("about.performance.auc.title")}</h3>
                <p className="text-muted-foreground">{t("about.performance.auc.desc1")}</p>
                <p className="text-muted-foreground mt-2">{t("about.performance.auc.desc2")}</p>
              </Card>
              <Card className="p-6 bg-gradient-card border-border/50">
                <div className="text-4xl mb-4">🔥</div>
                <h3 className="text-xl font-display font-bold mb-3">{t("about.performance.logloss.title")}</h3>
                <p className="text-muted-foreground">{t("about.performance.logloss.desc1")}</p>
                <p className="text-muted-foreground mt-2">{t("about.performance.logloss.desc2")}</p>
              </Card>
            </div>

            <div className="bg-gradient-card border border-border/50 rounded-xl p-6 sm:p-8 mb-8">
              <h2 className="text-2xl font-display font-bold mb-4">{t("about.valueBet.title")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">{t("about.valueBet.intro")}</p>
              <p className="text-muted-foreground leading-relaxed mb-6">{t("about.valueBet.formula")}</p>
              <div className="border-t border-border/30 pt-6">
                <h4 className="text-xl font-display font-bold mb-3">{t("about.valueBet.example.title")}</h4>
                <div className="space-y-2 text-muted-foreground leading-relaxed">
                  <p>{t("about.valueBet.example.scenario")}</p>
                  <p>{t("about.valueBet.example.team1")}</p>
                  <p>{t("about.valueBet.example.bookmaker")}</p>
                  <p>{t("about.valueBet.example.algorithm")}</p>
                  <p>{t("about.valueBet.example.calculation")}</p>
                  <p className="font-mono text-foreground">{t("about.valueBet.example.formulaCalc")}</p>
                  <p>{t("about.valueBet.example.conclusion")}</p>
                  <p>{t("about.valueBet.example.explanation")}</p>
                </div>
              </div>
            </div>

          </section>


          {/* Hidden SEO content */}
          <div className="sr-only">
            <h2>Résultats prouvés et transparents de notre IA de prédictions League of Legends</h2>
            <p>
              PredictEsport publie en toute transparence les performances de son modèle de Machine Learning sur les paris esport.
              Accuracy, AUC, LogLoss : nos métriques sont mesurées en continu sur l'ensemble des matchs LFL, LEC, LCK, LPL, LCS,
              MSI et Worlds. Notre approche basée sur LightGBM et le Voting Ensemble nous permet d'identifier des value bets sur
              Pinnacle, Unibet, Polymarket et Stake, pour évaluer la performance réelle de notre algorithme.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Results;
