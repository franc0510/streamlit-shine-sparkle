import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Award, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const About = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Demande envoyée !",
      description: "Nous vous enverrons les résultats ROI par email bientôt.",
    });
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 bg-gradient-gaming bg-clip-text text-transparent">
              Résultats
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Découvrez les performances de notre algorithme
            </p>
          </div>

          {/* Section Résultats Financiers (ROI) - déplacée en haut */}
          <div className="bg-gradient-card border border-border/50 rounded-xl p-8 animate-slide-up mb-16">
            <h2 className="text-3xl font-display font-bold mb-6 text-center">Résultats Financiers (ROI)</h2>
            <p className="text-muted-foreground text-center mb-6">
              Intéressé par les résultats financiers de nos prédictions ? Laissez-nous votre email et nous vous enverrons les détails de notre ROI.
            </p>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
              <Button type="submit" className="w-full">
                Recevoir les résultats ROI
              </Button>
            </form>
          </div>

          {/* Titre pour les performances */}
          <h2 className="text-3xl font-display font-bold mb-8 text-center">🔍 Les performances de notre algorithme</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-display font-bold mb-3">Accuracy — 69%</h3>
              <p className="text-muted-foreground">
                En moyenne, notre algorithme prédit correctement l'issue d'un match dans 69% des cas.
              </p>
              <p className="text-muted-foreground mt-2">
                Sur 10 matchs, il en devine 7 correctement.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-display font-bold mb-3">AUC — 0.76</h3>
              <p className="text-muted-foreground">
                L'AUC mesure la capacité du modèle à distinguer correctement gagnants et perdants.
              </p>
              <p className="text-muted-foreground mt-2">
                Avec un score de 0.76, l'algorithme est très fiable dans la détection des tendances gagnantes.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="text-4xl mb-4">🔥</div>
              <h3 className="text-xl font-display font-bold mb-3">LogLoss — 0.57</h3>
              <p className="text-muted-foreground">
                Ce score indique la précision des probabilités générées.
              </p>
              <p className="text-muted-foreground mt-2">
                Avec 0.57, nos prédictions sont cohérentes, stables et bien calibrées.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-display font-bold mb-3">En résumé</h3>
              <p className="text-muted-foreground">
                Des prédictions justes (69%)
              </p>
              <p className="text-muted-foreground mt-2">
                Un modèle fiable et stable (AUC 0.76)
              </p>
              <p className="text-muted-foreground mt-2">
                Des probabilités calibrées comme un modèle professionnel (LogLoss 0.57)
              </p>
            </Card>
          </div>

          <div className="bg-gradient-card border border-border/50 rounded-xl p-8 animate-slide-up mb-8" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-display font-bold mb-6 text-center">Notre histoire</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              J'ai découvert League of Legends en saison 3 et je suis tombé amoureux du jeu et de l'e-sport : les stratégies, les matchs qui basculent, l'ambiance frénétique. Depuis, je n'ai jamais arrêté de jouer, d'analyser et de vivre les compétitions. J'ai regardé l'ensemble des matchs de LEC et des Worlds tout au long de ma vie.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              En parallèle, je suis devenu Data Scientist et je me suis demandé :<br />
              « Et si je mettais mes compétences en data au service de ma passion pour l'e-sport ? »<br />
              C'est ainsi qu'est né PredictEsport.
            </p>
          </div>

          <div className="bg-gradient-card border border-border/50 rounded-xl p-8 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <h2 className="text-3xl font-display font-bold mb-6 text-center">Notre mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Mon objectif est clair : créer l'outil d'analyse que j'aurais voulu avoir, autant pour suivre l'e-sport en profondeur que pour parier intelligemment.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Chez PredictEsport, nous croyons que les données peuvent transformer la façon dont les fans d'e-sport comprennent et apprécient leurs jeux favoris. Nous offrons des prédictions ultra-précises et des analyses poussées pour League of Legends, Counter-Strike 2 et Dota 2.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Grâce à l'alliance de l'IA, de la statistique avancée et de notre passion pour l'e-sport, nous donnons aux fans un outil pour regarder les matchs avec un regard nouveau.
            </p>
          </div>
        </div>
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

export default About;
