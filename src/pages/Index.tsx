import { Navbar } from "@/components/Navbar";
import { MatchCard } from "@/components/MatchCard";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

const mockMatches = [
  {
    tournament: "WORLDS",
    date: "Jeu 16 Oct 2025",
    time: "08:00",
    format: "BO1",
    team1: {
      name: "Team Secret Whales",
      logo: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&h=200&fit=crop",
      winProbability: 51.3,
    },
    team2: {
      name: "kt Rolster",
      logo: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop",
      winProbability: 48.7,
    },
    minOdds: { team1: 1.95, team2: 2.05 },
  },
  {
    tournament: "WORLDS",
    date: "Jeu 16 Oct 2025",
    time: "09:00",
    format: "BO1",
    team1: {
      name: "G2 Esports",
      logo: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=200&h=200&fit=crop",
      winProbability: 60.9,
    },
    team2: {
      name: "Movistar KOI",
      logo: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200&h=200&fit=crop",
      winProbability: 39.1,
    },
    minOdds: { team1: 1.64, team2: 2.56 },
  },
  {
    tournament: "WORLDS",
    date: "Jeu 16 Oct 2025",
    time: "10:00",
    format: "BO1",
    team1: {
      name: "TOPESPORTS",
      logo: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200&h=200&fit=crop",
      winProbability: 75.2,
    },
    team2: {
      name: "100 Thieves",
      logo: "https://images.unsplash.com/photo-1563207153-f403bf289096?w=200&h=200&fit=crop",
      winProbability: 24.8,
    },
    minOdds: { team1: 1.33, team2: 4.03 },
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 bg-gradient-gaming bg-clip-text text-transparent">
            League of Legends
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Prédictions basées sur des modèles statistiques avancés
          </p>
          
          <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-lg px-6 py-3 mb-8">
            <Lock className="w-5 h-5 text-accent" />
            <p className="text-sm text-foreground/90">
              Accès complet aux prédictions avec un{" "}
              <Link to="/auth" className="text-accent font-semibold hover:underline">
                abonnement Premium
              </Link>
            </p>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold">
            Calendrier à venir
          </h2>
          <p className="text-sm text-muted-foreground">
            1 match gratuit • {mockMatches.length - 1} matchs Premium
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Premier match gratuit */}
          <MatchCard key={0} {...mockMatches[0]} />
          
          {/* Matchs verrouillés */}
          {mockMatches.slice(1).map((match, index) => (
            <div key={index + 1} className="relative animate-slide-up">
              <div className="absolute inset-0 backdrop-blur-sm bg-background/60 z-10 rounded-xl flex flex-col items-center justify-center gap-4 border-2 border-accent/30">
                <Lock className="w-12 h-12 text-accent animate-glow-pulse" />
                <div className="text-center px-4">
                  <p className="font-semibold text-lg mb-2">Contenu Premium</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Débloquez toutes les prédictions
                  </p>
                  <Link to="/auth">
                    <Button variant="default" size="sm" className="gap-2">
                      S'abonner
                      <Lock className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
              <MatchCard {...match} />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-gradient-card border border-border/50 rounded-xl p-8">
          <h3 className="text-2xl font-display font-bold mb-4">
            Débloquez toutes les prédictions
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Accédez à l'ensemble de nos analyses, prédictions avancées et statistiques détaillées pour maximiser vos chances de succès.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Commencer maintenant
              <Lock className="w-4 h-4" />
            </Button>
          </Link>
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

export default Index;
