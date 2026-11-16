import { Link } from "react-router-dom";
import { ArrowRight, Braces, Database, FileCheck2, GitBranch, LineChart, Radar, ShieldCheck, Sigma, Timer } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Freshness, Kpi, PnlChart, StagePill } from "@/components/stats/parts";
import { pct, usd, useCs2Status, useLolTrack, useManifest } from "@/lib/stats";
import { useTr } from "@/hooks/useTr";

const Landing = () => {
  const { tr, lng } = useTr();
  const { data: lol } = useLolTrack();
  const { data: cs2 } = useCs2Status();
  const { data: man } = useManifest();
  const s = lol?.summary;

  const products = [
    { icon: Radar, title: tr("Probabilités de match", "Match probabilities"), body: tr("Probabilité de victoire calibrée pour chaque série LoL à venir (LCK, LEC, LPL, LCS, Worlds, ligues régionales…), avec format BO1/BO3/BO5.", "Calibrated win probability for every upcoming LoL series (LCK, LEC, LPL, LCS, Worlds, regional leagues…), BO1/BO3/BO5 aware."), cta: tr("Voir les prédictions", "See predictions"), to: "/predictions", tag: "live" as const },
    { icon: Sigma, title: tr("Cotes & value bets", "Odds & value bets"), body: tr("Probabilité du modèle comparée au prix du marché (Polymarket, Pinnacle/PS3838) : avantage estimé, prix limite et profondeur du carnet.", "Model probability compared with market price (Polymarket, Pinnacle/PS3838): estimated edge, limit price and order-book depth."), cta: tr("Voir le track record", "See the track record"), to: "/track-record", tag: "live" as const },
    { icon: Database, title: tr("Jeux de données historiques", "Historical datasets"), body: tr("Historique horodaté de nos prédictions, séries de cotes et registre des paris, en CSV/JSON, avec empreintes SHA-256.", "Timestamped history of our predictions, odds series and bet ledger, as CSV/JSON with SHA-256 fingerprints."), cta: tr("Télécharger les données", "Download data"), to: "/track-record#verification", tag: "live" as const },
    { icon: Braces, title: tr("API & livraison de données", "API & data delivery"), body: tr("Flux JSON/CSV mis à jour automatiquement. Accès API et licences sur mesure pour médias, analystes et opérateurs.", "Automatically updated JSON/CSV feeds. API access and custom licences for media, analysts and operators."), cta: tr("Nous contacter", "Contact us"), to: "/about#contact", tag: "soon" as const },
  ];

  const games = [
    { name: "League of Legends", stage: "live" as const, line: tr("Pronostics en production, paris réels depuis le 13/08/2026.", "Forecasts in production, real-money bets since 13 Aug 2026."), to: "/track-record" },
    { name: tr("LoL · semi-live par game", "LoL · semi-live per game"), stage: "dev" as const, line: tr("Réévaluation entre les games et paris game par game. Pas de résultats publiés.", "Between-game re-estimation and game-by-game bets. No results published."), to: "/labs" },
    { name: "Counter-Strike 2", stage: "test" as const, line: tr("Paper trading quotidien, journal public.", "Daily paper trading, public log."), to: "/cs2" },
    { name: "Dota 2", stage: "soon" as const, line: tr("Prévu.", "Planned."), to: "/dota2" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="PredictEsport — Données, probabilités et cotes esport vérifiables"
        description="Probabilités de victoire, cotes et value bets esport (LoL, CS2 en test) avec un track record public, recalculé automatiquement et vérifiable."
        path="/"
        jsonLd={[
          { "@context": "https://schema.org", "@type": "Organization", name: "PredictEsport", url: "https://predictesport.com/" },
          { "@context": "https://schema.org", "@type": "WebSite", name: "PredictEsport", url: "https://predictesport.com/" },
        ]}
      />
      <Navbar />

      {/* HERO */}
      <header className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "radial-gradient(60% 80% at 80% 0%, hsl(186 100% 42% / 0.12), transparent), radial-gradient(50% 70% at 0% 100%, hsl(43 56% 51% / 0.12), transparent)" }} />
        <div className="container relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> {tr("Chaque chiffre est vérifiable", "Every number is verifiable")}
          </div>
          <h1 className="max-w-4xl font-display text-5xl font-bold leading-[1.05] sm:text-7xl">
            {tr("Données et cotes esport.", "Esports data & odds.")}{" "}
            <span className="bg-gradient-gaming bg-clip-text text-transparent">{tr("Avec preuves.", "With proof.")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            {tr(
              "Probabilités de victoire, value bets et jeux de données esport. Notre track record LoL est public, complet et recalculé automatiquement depuis notre code — vous n'avez pas à nous croire sur parole.",
              "Win probabilities, value bets and esports datasets. Our LoL track record is public, complete and recomputed automatically from our code — you don't have to take our word for it.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/track-record"><Button size="lg" className="gap-2">{tr("Voir le track record", "See the track record")} <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/about#contact"><Button size="lg" variant="outline">{tr("Demander un accès aux données", "Request data access")}</Button></Link>
          </div>
        </div>
      </header>

      {/* TRACK RECORD LIVE */}
      <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-3"><StagePill stage="live" /><span className="text-xs uppercase tracking-[0.2em] text-primary">{tr("Track record LoL · depuis le 13 août 2026", "LoL track record · since 13 Aug 2026")}</span></div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{tr("Résultats réels, en clair", "Real results, in the open")}</h2>
          </div>
          <Link to="/track-record" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{tr("Registre complet", "Full ledger")} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {s && lol ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="rounded-xl border border-border/60 bg-card/60 p-3 sm:p-5">
                <PnlChart daily={lol.daily} height={280} />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <Kpi label={tr("Résultat cumulé", "Cumulative P&L")} value={usd(s.pnl_usd, true)} tone={s.pnl_usd >= 0 ? "pos" : "neg"} sub={`${s.n_settled} ${tr("paris réglés", "settled bets")}`} />
                <Kpi label="ROI" value={pct(s.roi, 1, true)} tone={s.roi >= 0 ? "pos" : "neg"} sub={s.roi_ci95 ? `IC 95 % : ${pct(s.roi_ci95[0], 0, true)} → ${pct(s.roi_ci95[1], 0, true)}` : undefined} />
              </div>
            </div>
            <div className="mt-4"><Freshness asof={s.data_asof} generated={man?.generated_utc} /></div>
          </>
        ) : (
          <div className="h-72 animate-pulse rounded-xl bg-card/60" />
        )}
      </section>

      {/* PRODUITS */}
      <section id="produits" className="border-y border-border/60 bg-card/20">
        <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{tr("Produits", "Products")}</div>
          <h2 className="mb-8 font-display text-3xl font-bold sm:text-4xl">{tr("Ce que nous fournissons", "What we provide")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <article key={p.title} className="flex flex-col rounded-xl border border-border/60 bg-card/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p.icon className="h-7 w-7 text-primary" />
                  {p.tag === "soon" && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{tr("Sur demande", "On request")}</span>}
                </div>
                <h3 className="mb-2 font-display text-xl font-bold">{p.title}</h3>
                <p className="mb-4 flex-1 text-sm text-muted-foreground">{p.body}</p>
                <Link to={p.to} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{p.cta} <ArrowRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COUVERTURE */}
      <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{tr("Couverture", "Coverage")}</div>
        <h2 className="mb-2 font-display text-3xl font-bold sm:text-4xl">{tr("Où nous en sommes, jeu par jeu", "Where we stand, game by game")}</h2>
        <p className="mb-8 max-w-2xl text-muted-foreground">{tr("Nous affichons le vrai statut de chaque chantier — en production, en développement ou en test.", "We show the true status of every workstream — live, in development or in testing.")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {games.map((g) => (
            <Link key={g.name} to={g.to} className="group rounded-xl border border-border/60 bg-card/60 p-5 transition-colors hover:border-primary/50">
              <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-display text-xl font-bold">{g.name}</h3><StagePill stage={g.stage} /></div>
              <p className="text-sm text-muted-foreground">{g.line}</p>
              {g.name === "Counter-Strike 2" && cs2 && (
                <p className="mt-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                  <Timer className="mr-1 inline h-3.5 w-3.5" />
                  {cs2.decisions_logged} {tr("décisions journalisées", "decisions logged")} · {cs2.bets_logged} {tr("paris papier", "paper bets")} · {tr("bankroll fictive", "virtual bankroll")} {cs2.bankroll_virtual_usd == null ? "—" : usd(cs2.bankroll_virtual_usd)}
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* TRANSPARENCE */}
      <section className="border-t border-border/60 bg-card/20">
        <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{tr("Transparence", "Transparency")}</div>
          <h2 className="mb-8 font-display text-3xl font-bold sm:text-4xl">{tr("Pourquoi vous pouvez vérifier", "Why you can check it")}</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: GitBranch, t: tr("Calculé depuis le code", "Computed from code"), b: tr("Les stats sont régénérées automatiquement depuis nos deux dépôts GitHub. Aucune saisie manuelle.", "Stats are regenerated automatically from our two GitHub repositories. No manual entry.") },
              { icon: FileCheck2, t: tr("Tous les paris, sans tri", "Every bet, no cherry-picking"), b: tr("Gagnants et perdants dans le même registre, avec le lien du marché Polymarket public.", "Winners and losers in the same ledger, with the public Polymarket market link.") },
              { icon: ShieldCheck, t: tr("Empreintes SHA-256", "SHA-256 fingerprints"), b: tr("Chaque fichier est empreint et rattaché à un commit. Un bouton vérifie l'intégrité dans votre navigateur.", "Each file is fingerprinted and tied to a commit. One button verifies integrity in your browser.") },
              { icon: LineChart, t: tr("Incertitude affichée", "Uncertainty shown"), b: tr("Intervalle de confiance du ROI, ligues perdantes, limites et dates de fraîcheur : on montre aussi ce qui dérange.", "ROI confidence interval, losing leagues, limits and freshness dates: we show the uncomfortable parts too.") },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-border/60 bg-card/60 p-5">
                <x.icon className="mb-3 h-6 w-6 text-primary" />
                <h3 className="mb-1.5 font-semibold">{x.t}</h3>
                <p className="text-sm text-muted-foreground">{x.b}</p>
              </div>
            ))}
          </div>
          <div className="mt-8"><Link to="/track-record#verification"><Button variant="outline" className="gap-2"><ShieldCheck className="h-4 w-4" />{tr("Vérifier les chiffres", "Verify the numbers")}</Button></Link></div>
          {man && <p className="mt-4 text-xs text-muted-foreground">{tr("Dernière régénération", "Last rebuild")} : {new Date(man.generated_utc).toLocaleString(lng, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</p>}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
