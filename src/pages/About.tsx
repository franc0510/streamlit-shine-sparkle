import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Award, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const About = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: t('about.roi.successTitle'),
      description: t('about.roi.successDescription'),
    });
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-6 bg-gradient-gaming bg-clip-text text-transparent">
              {t('about.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              {t('about.subtitle')}
            </p>
          </div>

          {/* Section Résultats Financiers (ROI) */}
          <div className="bg-gradient-card border border-border/50 rounded-xl p-8 animate-slide-up mb-16">
            <h2 className="text-3xl font-display font-bold mb-6 text-center">{t('about.roi.title')}</h2>
            <p className="text-muted-foreground text-center mb-6">
              {t('about.roi.description')}
            </p>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
              <Input
                type="email"
                placeholder={t('about.roi.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
              <Button type="submit" className="w-full">
                {t('about.roi.submit')}
              </Button>
            </form>
          </div>

          {/* Performances */}
          <h2 className="text-3xl font-display font-bold mb-8 text-center">{t('about.performance.title')}</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-display font-bold mb-3">{t('about.performance.accuracy.title')}</h3>
              <p className="text-muted-foreground">
                {t('about.performance.accuracy.desc1')}
              </p>
              <p className="text-muted-foreground mt-2">
                {t('about.performance.accuracy.desc2')}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-display font-bold mb-3">{t('about.performance.auc.title')}</h3>
              <p className="text-muted-foreground">
                {t('about.performance.auc.desc1')}
              </p>
              <p className="text-muted-foreground mt-2">
                {t('about.performance.auc.desc2')}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="text-4xl mb-4">🔥</div>
              <h3 className="text-xl font-display font-bold mb-3">{t('about.performance.logloss.title')}</h3>
              <p className="text-muted-foreground">
                {t('about.performance.logloss.desc1')}
              </p>
              <p className="text-muted-foreground mt-2">
                {t('about.performance.logloss.desc2')}
              </p>
            </Card>
          </div>

          {/* Value Bet */}
          <div className="bg-gradient-card border border-border/50 rounded-xl p-8 animate-slide-up mb-8" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-display font-bold mb-6">{t('about.valueBet.title')}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              {t('about.valueBet.intro')}
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              {t('about.valueBet.formula')}
            </p>
            
            <div className="border-t border-border/30 pt-6">
              <h3 className="text-2xl font-display font-bold mb-4">{t('about.valueBet.example.title')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                {t('about.valueBet.example.scenario')}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-2">
                {t('about.valueBet.example.team1')}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                {t('about.valueBet.example.bookmaker')}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                {t('about.valueBet.example.algorithm')}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-2">
                {t('about.valueBet.example.calculation')}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                {t('about.valueBet.example.formulaCalc')}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-2">
                {t('about.valueBet.example.conclusion')}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t('about.valueBet.example.explanation')}
              </p>
            </div>
          </div>

          {/* Notre Histoire */}
          <div className="bg-gradient-card border border-border/50 rounded-xl p-8 animate-slide-up mb-8" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-display font-bold mb-6 text-center">{t('about.story.title')}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              {t('about.story.text1')}
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              {t('about.story.text2')}
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t('about.story.text3')}
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PredictEsport. {t('about.footer.rights')}</p>
          <p className="mt-2 text-xs max-w-3xl mx-auto">
            {t('about.footer.disclaimer')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;
