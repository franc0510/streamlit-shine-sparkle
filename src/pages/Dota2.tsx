import { Navbar } from "@/components/Navbar";
import { Lock } from "lucide-react";

const Dota2 = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted/20 mb-8">
            <Lock className="w-12 h-12 text-muted-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-muted-foreground/50">
            DOTA 2
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Les prédictions DOTA 2 arrivent bientôt !
          </p>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nous travaillons actuellement sur l'intégration de DOTA 2. 
            Nos modèles d'analyse sont en cours de développement pour vous offrir 
            les meilleures prédictions possibles.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dota2;
