import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useTr } from "@/hooks/useTr";

// Les tarifs ne sont volontairement pas publiés : toute offre passe par un échange avec l'équipe.
const Pricing = () => {
  const { tr } = useTr();
  const plans = [
    { t: tr("Probabilités & prédictions", "Probabilities & predictions"), b: tr("Accès aux prédictions LoL, historique horodaté, mises à jour quotidiennes.", "Access to LoL predictions, timestamped history, daily updates.") },
    { t: tr("Cotes & value bets", "Odds & value bets"), b: tr("Probabilité du modèle comparée au marché, avantage estimé et registre des paris.", "Model probability compared with the market, estimated edge and bet ledger.") },
    { t: tr("Jeux de données & licences", "Datasets & licences"), b: tr("Livraison CSV/JSON, historiques et licences sur mesure pour médias, analystes et opérateurs.", "CSV/JSON delivery, histories and custom licences for media, analysts and operators.") },
  ];
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Offres et accès aux données — PredictEsport"
        description="Offres sur mesure pour accéder aux probabilités, cotes et jeux de données esport PredictEsport. Contactez l'équipe pour une proposition."
        path="/pricing"
      />
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{tr("Offres", "Plans")}</div>
          <h1 className="font-display text-4xl font-bold sm:text-6xl">{tr("Une offre adaptée à votre usage.", "A plan built around your use.")}</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {tr("Nos offres sont établies sur mesure. Contactez-nous : nous vous répondons avec une proposition adaptée à votre besoin.", "Our plans are tailored. Get in touch and we'll reply with a proposal that fits your needs.")}
          </p>
          <Link to="/about#contact" className="mt-8 inline-block">
            <Button size="lg" className="h-12 gap-2 px-7">{tr("Nous contacter", "Contact us")} <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.t} className="rounded-2xl border border-border bg-card/60 p-6">
              <Check className="mb-3 h-5 w-5 text-accent" />
              <h2 className="mb-2 font-display text-xl font-bold">{p.t}</h2>
              <p className="text-sm text-muted-foreground">{p.b}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
