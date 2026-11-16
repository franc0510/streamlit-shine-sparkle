import { Link } from "react-router-dom";
import { ArrowRight, FlaskConical, Radio, Scale, Target, Timer, Layers, Gauge } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Stage, StagePill } from "@/components/stats/parts";
import { useTr } from "@/hooks/useTr";

interface Item { icon: typeof Radio; stage: Stage; title: string; body: string; proof: string }

const Labs = () => {
  const { tr } = useTr();

  const betting: Item[] = [
    {
      icon: Radio, stage: "dev",
      title: tr("Semi-live : parier game par game", "Semi-live: betting game by game"),
      body: tr(
        "Aujourd'hui le modèle pronostique la série entière avant le match. Nous construisons une version qui réévalue la probabilité entre les games (score, draft, forme du jour) et mise sur le vainqueur de la game suivante.",
        "Today the model forecasts the whole series before it starts. We are building a version that re-estimates the probability between games (score, draft, current form) and bets on the next game's winner.",
      ),
      proof: tr("Aucun résultat publié pour l'instant. Il n'en sera publié qu'avec les mêmes règles que le track record : registre complet, tous paris inclus.", "No results published yet. They will only be published under the same rules as the track record: full ledger, every bet included."),
    },
    {
      icon: Gauge, stage: "dev",
      title: tr("Calibration par ligue et par format", "Calibration by league and format"),
      body: tr(
        "Recaler les probabilités en walk-forward par ligue et par BO1/BO3/BO5, au niveau série. Objectif : corriger la sur-confiance du modèle sur ses value bets (voir la calibration du track record).",
        "Re-calibrating probabilities walk-forward by league and BO1/BO3/BO5, at series level. Goal: fix the model's overconfidence on its value bets (see the track-record calibration).",
      ),
      proof: tr("Banc d'essai commun : chaque idée est notée sur les mêmes paris réels et le même univers de marchés depuis le 13/08/2026.", "Common test bench: every idea is scored on the same real bets and the same market universe since 13 Aug 2026."),
    },
    {
      icon: Layers, stage: "dev",
      title: tr("État des équipes à la date du match", "Team state at match date"),
      body: tr(
        "Utiliser l'état exact des équipes (rosters, forme) au moment du match plutôt que leur dernière ligne connue, et un garde-fou de fraîcheur des données avant tout pari.",
        "Use each team's exact state (rosters, form) at match time rather than the latest known row, plus a data-freshness guard before any bet.",
      ),
      proof: tr("Le garde-fou de fraîcheur existe déjà en production ; l'évaluation de l'état « à la date » est en cours.", "The freshness guard is already in production; the as-of-date state evaluation is in progress."),
    },
    {
      icon: Scale, stage: "dev",
      title: tr("Mise et exécution : Kelly fractionné, profondeur du carnet", "Staking & execution: fractional Kelly, order-book depth"),
      body: tr(
        "Dimensionner les mises selon l'edge et la profondeur réelle du carnet Polymarket, avec prix limite, pour limiter le glissement.",
        "Size stakes from edge and the real Polymarket order-book depth, with limit prices, to limit slippage.",
      ),
      proof: tr("Relevés de profondeur du carnet collectés en continu dans le dépôt.", "Order-book depth snapshots are collected continuously in the repository."),
    },
    {
      icon: Target, stage: "dev",
      title: tr("CLV : mesurer l'avantage avant le résultat", "CLV: measuring edge before results"),
      body: tr(
        "La Closing Line Value compare notre prix d'entrée au prix de clôture : c'est un signal bien moins bruité que le P&L pour savoir si l'on bat réellement le marché.",
        "Closing Line Value compares our entry price with the closing price — a far less noisy signal than P&L for knowing whether we really beat the market.",
      ),
      proof: tr("Tableau de bord de suivi CLV prévu.", "CLV monitoring dashboard planned."),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Labs — algorithmes en développement | PredictEsport"
        description="Ce que nous construisons : parier game par game (semi-live), calibration, mise et CLV sur LoL, et le test CS2. Statut honnête de chaque chantier."
        path="/labs"
      />
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-3 flex items-center gap-2 text-primary"><FlaskConical className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.2em]">Labs</span></div>
        <h1 className="mb-3 font-display text-4xl font-bold sm:text-5xl">{tr("Ce que nous construisons", "What we are building")}</h1>
        <p className="mb-10 max-w-3xl text-muted-foreground">
          {tr(
            "Les algorithmes ci-dessous ne sont pas en production. Nous les listons avec leur vrai statut : tant qu'une idée n'a pas de résultats vérifiables, nous ne publions aucun chiffre dessus.",
            "The algorithms below are not in production. We list them with their true status: until an idea has verifiable results, we publish no numbers for it.",
          )}
        </p>

        <h2 className="mb-4 font-display text-2xl font-bold">League of Legends — {tr("améliorations en développement", "improvements in development")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {betting.map((it) => (
            <article key={it.title} className="rounded-xl border border-border/60 bg-card/60 p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <it.icon className="h-6 w-6 text-primary" />
                <StagePill stage={it.stage} />
              </div>
              <h3 className="mb-2 font-display text-xl font-bold">{it.title}</h3>
              <p className="mb-3 text-sm text-muted-foreground">{it.body}</p>
              <p className="border-t border-border/40 pt-3 text-xs text-muted-foreground"><b className="text-foreground">{tr("Preuves :", "Evidence:")}</b> {it.proof}</p>
            </article>
          ))}
        </div>

        <h2 className="mb-4 mt-14 font-display text-2xl font-bold">Counter-Strike 2 — {tr("en test", "in testing")}</h2>
        <article className="rounded-xl border border-sky-500/30 bg-card/60 p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Timer className="h-6 w-6 text-sky-300" />
            <StagePill stage="test" />
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {tr(
              "Un modèle CS2 complet existe (entraîné et évalué en walk-forward sur plus de 27 000 séries). Il tourne chaque jour en paper trading : il décide, journalise le prix réel du carnet et les frais, mais ne place aucun ordre. Aucun bilan de rentabilité ne sera publié avant d'avoir assez de paris réglés.",
              "A full CS2 model exists (trained and evaluated walk-forward on 27,000+ series). It runs daily in paper trading: it decides and logs the real order-book price and fees but places no orders. No profitability review will be published before enough bets have settled.",
            )}
          </p>
          <Link to="/cs2" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            {tr("Voir le journal de test CS2 en direct", "See the live CS2 test log")} <ArrowRight className="h-4 w-4" />
          </Link>
        </article>

        <div className="mt-14 rounded-xl border border-border/60 bg-card/40 p-5 text-sm text-muted-foreground">
          <b className="text-foreground">{tr("Notre règle de publication", "Our publication rule")}</b> —{" "}
          {tr(
            "Un algorithme passe de « en développement » à « en production » seulement après des résultats vérifiables, avec le même registre public que le track record LoL.",
            "An algorithm only moves from 'in development' to 'in production' after verifiable results, with the same public ledger as the LoL track record.",
          )}{" "}
          <Link to="/track-record" className="text-primary hover:underline">{tr("Voir le track record →", "See the track record →")}</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Labs;
