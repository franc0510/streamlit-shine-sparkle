import { Link } from "react-router-dom";
import { ArrowRight, Gauge, Layers, Radio, Scale, Target, Timer, Trophy } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useTr } from "@/hooks/useTr";

// 0 = idée · 1 = développement · 2 = test (paper) · 3 = production
const Stepper = ({ at }: { at: number }) => {
  const { tr } = useTr();
  const steps = [tr("Idée", "Idea"), tr("Dév.", "Dev"), tr("Test", "Test"), "Live"];
  return (
    <div className="mt-5">
      <div className="flex items-center">
        {steps.map((_, i) => (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <span className={`h-3 w-3 rounded-full ${i < at ? "bg-primary" : i === at ? "bg-accent ring-4 ring-accent/25" : "bg-secondary"}`} />
            {i < steps.length - 1 && <span className={`h-0.5 flex-1 ${i < at ? "bg-primary" : "bg-secondary"}`} />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">{steps.map((l, i) => <span key={l} className={i === at ? "font-semibold text-accent" : ""}>{l}</span>)}</div>
    </div>
  );
};

const Labs = () => {
  const { tr } = useTr();
  const items = [
    { i: Trophy, t: tr("LoL · pronostics de séries", "LoL · series forecasts"), d: tr("Argent réel depuis le 13/08", "Real money since 13 Aug"), at: 3, to: "/track-record" },
    { i: Timer, t: tr("CS2 · paper trading", "CS2 · paper trading"), d: tr("Journal public quotidien", "Daily public log"), at: 2, to: "/cs2" },
    { i: Radio, t: tr("LoL · semi-live par game", "LoL · semi-live per game"), d: tr("Parier game par game", "Bet game by game"), at: 1 },
    { i: Gauge, t: tr("Calibration par ligue & format", "Calibration by league & format"), d: tr("Probabilités plus justes", "More accurate probabilities"), at: 1 },
    { i: Layers, t: tr("État des équipes à la date du match", "Team state at match date"), d: tr("Moins de données périmées", "Fewer stale inputs"), at: 1 },
    { i: Scale, t: tr("Mise & carnet d'ordres", "Staking & order book"), d: tr("Kelly fractionné, prix limite", "Fractional Kelly, limit price"), at: 1 },
    { i: Target, t: tr("Suivi CLV", "CLV tracking"), d: tr("Mesurer l'avantage tôt", "Measure edge early"), at: 0 },
  ];
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Labs — algorithmes en développement | PredictEsport"
        description="Ce que nous construisons : parier game par game (semi-live), calibration, mise et CLV sur LoL, et le test CS2."
        path="/labs"
      />
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Labs</div>
        <h1 className="font-display text-4xl font-bold sm:text-6xl">{tr("En construction.", "Under construction.")}</h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">{tr("Aucun chiffre publié tant qu'un module n'a pas de résultats vérifiables.", "No figures published until a module has verifiable results.")}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const card = (
              <div className="h-full rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:border-primary/50">
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary"><it.i className="h-6 w-6" /></span>
                <div className="font-display text-lg font-bold leading-snug">{it.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{it.d}</div>
                <Stepper at={it.at} />
                {it.to && <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">{tr("Voir", "View")} <ArrowRight className="h-4 w-4" /></div>}
              </div>
            );
            return it.to ? <Link key={it.t} to={it.to}>{card}</Link> : <div key={it.t}>{card}</div>;
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Labs;
