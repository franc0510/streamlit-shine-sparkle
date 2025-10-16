import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Award, Users } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 bg-gradient-gaming bg-clip-text text-transparent">
              À propos de PredicteSport
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              La plateforme de prédictions e-sport la plus précise, propulsée par l'intelligence artificielle et l'analyse de données
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

          <div className="bg-gradient-card border border-border/50 rounded-xl p-8 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-display font-bold mb-6 text-center">Notre Mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Chez PredicteSport, nous croyons que les données peuvent transformer la façon dont les fans d'e-sport comprennent et apprécient leurs jeux favoris. Notre mission est de fournir les prédictions les plus précises et les analyses les plus approfondies pour League of Legends, CS2 et DOTA 2.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              En combinant l'intelligence artificielle de pointe, l'analyse statistique avancée et une passion profonde pour l'e-sport, nous créons un outil indispensable pour tous ceux qui veulent comprendre les matchs à un niveau plus profond.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PredicteSport. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
