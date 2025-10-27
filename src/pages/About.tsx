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
              Découvrez les résultats et performances de nos prédictions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up">
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-display font-bold mb-3">Analyse Avancée</h3>
              <p className="text-muted-foreground">
                Nos modèles statistiques analysent des milliers de données de matchs pour prédire les résultats avec une précision exceptionnelle.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <Target className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-display font-bold mb-3">Précision Maximale</h3>
              <p className="text-muted-foreground">
                Nos prédictions sont constamment affinées grâce à l'apprentissage automatique et l'analyse en temps réel des performances.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Award className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-display font-bold mb-3">Expertise E-Sport</h3>
              <p className="text-muted-foreground">
                Une équipe d'analystes passionnés par l'e-sport, combinant expertise du jeu et science des données.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Users className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-display font-bold mb-3">Communauté Active</h3>
              <p className="text-muted-foreground">
                Rejoignez des milliers d'utilisateurs qui font confiance à nos prédictions pour leurs analyses e-sport.
              </p>
            </Card>
          </div>

          <div className="bg-gradient-card border border-border/50 rounded-xl p-8 animate-slide-up mb-8" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-display font-bold mb-6 text-center">Notre Mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Chez PredictEsport, nous croyons que les données peuvent transformer la façon dont les fans d'e-sport comprennent et apprécient leurs jeux favoris. Notre mission est de fournir les prédictions les plus précises et les analyses les plus approfondies pour League of Legends, CS2 et DOTA 2.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              En combinant l'intelligence artificielle de pointe, l'analyse statistique avancée et une passion profonde pour l'e-sport, nous créons un outil indispensable pour tous ceux qui veulent comprendre les matchs à un niveau plus profond.
            </p>
          </div>

          <div className="bg-gradient-card border border-border/50 rounded-xl p-8 animate-slide-up" style={{ animationDelay: "0.5s" }}>
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
