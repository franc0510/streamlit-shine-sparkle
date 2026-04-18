import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const Results = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
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

  return (
    <div className="min-h-screen bg-background">
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
              <h3 className="text-2xl font-display font-bold mb-4">{t("about.valueBet.title")}</h3>
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

            <div className="bg-gradient-card border border-border/50 rounded-xl p-6 sm:p-8">
              <h3 className="text-2xl font-display font-bold mb-3 text-center">{t("about.roi.title")}</h3>
              <p className="text-muted-foreground text-center mb-6">{t("about.roi.description")}</p>
              <form onSubmit={handleRoiSubmit} className="max-w-md mx-auto space-y-4">
                <Input
                  type="email"
                  placeholder={t("about.roi.emailPlaceholder")}
                  value={roiEmail}
                  onChange={(e) => setRoiEmail(e.target.value)}
                  required
                  className="bg-background/50"
                />
                <Button type="submit" className="w-full" disabled={roiLoading}>
                  {roiLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("about.roi.sending")}</>
                  ) : (
                    t("about.roi.submit")
                  )}
                </Button>
              </form>
            </div>
          </section>

          {/* Hidden SEO content */}
          <div className="sr-only">
            <h2>Résultats prouvés et transparents de notre IA de prédictions League of Legends</h2>
            <p>
              PredictEsport publie en toute transparence les performances de son modèle de Machine Learning sur les paris esport.
              Accuracy, AUC, LogLoss : nos métriques sont mesurées en continu sur l'ensemble des matchs LFL, LEC, LCK, LPL, LCS,
              MSI et Worlds. Notre approche basée sur LightGBM et le Voting Ensemble nous permet d'identifier des value bets sur
              Pinnacle, Unibet, Polymarket et Stake. Recevez gratuitement par email un rapport détaillé du ROI réalisé sur
              les Worlds 2025 pour évaluer la rentabilité réelle de notre algorithme avant de souscrire.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Results;
