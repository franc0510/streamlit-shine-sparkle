import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Braces, Database, Radar, ShieldCheck, Sigma, Cpu, Scale, BadgeCheck } from "lucide-react";
import { LeagueRoi, Legend2, MonthRoi, PriceVsWin, WinDonut } from "@/components/stats/charts";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Freshness, PnlChart, StagePill } from "@/components/stats/parts";
import { pct, usd, useCs2Status, useLedger, useLolTrack, useManifest } from "@/lib/stats";
import { useTr } from "@/hooks/useTr";

const Window = ({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) => (
  <div className={`overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-30px_hsl(255_92%_70%/0.35)] ${className}`}>
    <div className="flex items-center gap-2 border-b border-border/70 bg-secondary/40 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
      <span className="ml-3 font-mono text-xs text-muted-foreground">{title}</span>
    </div>
    {children}
  </div>
);

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{children}</div>
);

// Exemple réel : dernière prédiction « ok » de Documents/predictions_history.csv
const SAMPLE = `{
  "match": "Gen.G Esports vs BILIBILI GAMING",
  "league": "Worlds",
  "format": "BO5",
  "start_utc": "2026-11-14T19:00:00Z",
  "generated_utc": "2026-11-14T11:41:00Z",
  "probability": {
    "Gen.G Esports": 0.7485,
    "BILIBILI GAMING": 0.2515
  }
}`;

const Landing = () => {
  const { tr, lng } = useTr();
  const { data: lol } = useLolTrack();
  const { data: cs2 } = useCs2Status();
  const { data: man } = useManifest();
  const { data: ledger } = useLedger();
  const s = lol?.summary;
  const last = (ledger ?? []).slice(-4).reverse();

  const stats = [
    { v: s ? String(s.n_settled) : "—", l: tr("paris réels réglés, tous publiés", "settled real bets, all published") },
    { v: s ? pct(s.roi, 1, true) : "—", l: tr("ROI depuis le 13 août 2026", "ROI since 13 Aug 2026") },
    { v: cs2?.eval.n_series ? cs2.eval.n_series.toLocaleString(lng) : "—", l: tr("séries CS2 évaluées en walk-forward", "CS2 series evaluated walk-forward") },
    { v: s ? s.predictions_ok_since_start.toLocaleString(lng) : "—", l: tr("prédictions LoL horodatées depuis le 13/08", "timestamped LoL predictions since 13 Aug") },
  ];

  const rows = [
    { g: "League of Legends", m: tr("Probabilités de séries (BO1/3/5)", "Series probabilities (BO1/3/5)"), st: "live" as const, to: "/track-record", ev: tr("Track record public", "Public track record") },
    { g: "League of Legends", m: tr("Semi-live · paris game par game", "Semi-live · game-by-game betting"), st: "dev" as const, to: "/labs", ev: tr("Aucun résultat publié", "No results published") },
    { g: "Counter-Strike 2", m: tr("Probabilités + mélange avec le marché", "Probabilities + market blend"), st: "test" as const, to: "/cs2", ev: tr("Journal de paper trading", "Paper-trading log") },
    { g: "Dota 2", m: tr("Probabilités de séries", "Series probabilities"), st: "soon" as const, to: "/dota2", ev: "—" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="PredictEsport — Données, probabilités et cotes esport vérifiables"
        description="Probabilités de victoire, cotes et value bets esport (LoL en production, CS2 en test) avec un track record public, recalculé automatiquement et vérifiable."
        path="/"
        jsonLd={[
          { "@context": "https://schema.org", "@type": "Organization", name: "PredictEsport", url: "https://predictesport.com/" },
          { "@context": "https://schema.org", "@type": "WebSite", name: "PredictEsport", url: "https://predictesport.com/" },
        ]}
      />
      <Navbar />

      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
        <div className="container relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Link to="/track-record" className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 py-1 pl-1 pr-3 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <span className="rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground">{tr("Nouveau", "New")}</span>
              {tr("Track record LoL public et vérifiable", "Public, verifiable LoL track record")} <ArrowRight className="h-3 w-3" />
            </Link>
            <h1 className="font-display text-5xl font-bold leading-[1.04] sm:text-6xl lg:text-[4.25rem]">
              {tr("La donnée esport.", "Esports data.")}{" "}
              <span className="bg-gradient-gaming bg-clip-text text-transparent">{tr("Vérifiable.", "Verifiable.")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {tr("Probabilités, cotes et value bets esport.", "Esports probabilities, odds and value bets.")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/about#contact"><Button size="lg" className="h-12 px-6">{tr("Demander un accès", "Request access")}</Button></Link>
              <Link to="/track-record"><Button size="lg" variant="outline" className="h-12 gap-2 px-6">{tr("Voir les résultats", "View results")} <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-accent" />{tr("Tous les paris publiés · vérifiable", "Every bet published · verifiable")}</div>
          </div>

          <Window title="match_prediction.json">
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-slate-300">
              {SAMPLE.split("\n").map((ln, i) => {
                const m = ln.match(/^(\s*)("[^"]+")(: )(.*?)(,?)$/);
                if (!m) return <div key={i}>{ln}</div>;
                const num = /^[0-9.]+$/.test(m[4]);
                return <div key={i}>{m[1]}<span className="text-sky-300">{m[2]}</span>{m[3]}<span className={num ? "text-amber-300" : m[4].startsWith("{") ? "" : "text-emerald-300"}>{m[4]}</span>{m[5]}</div>;
              })}
            </pre>
            <div className="border-t border-border/70 bg-secondary/30 px-5 py-2.5 text-[11px] text-muted-foreground">
              {tr("Exemple réel tiré de notre historique de prédictions · format de livraison indicatif", "Real example from our prediction history · indicative delivery format")}
            </div>
          </Window>
        </div>
      </header>

      {/* STATS */}
      <section className="border-y border-border/70 bg-card/30">
        <div className="container mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 lg:grid-cols-4">
          {stats.map((x) => (
            <div key={x.l} className="py-8 lg:px-6 lg:first:pl-0">
              <div className="font-display text-4xl font-bold tabular-nums">{x.v}</div>
              <div className="mt-1 text-sm text-muted-foreground">{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="container mx-auto max-w-6xl px-4 pt-20">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { i: Database, t: tr("Données", "Data"), d: tr("Matchs, joueurs, drafts", "Matches, players, drafts") },
            { i: Cpu, t: tr("Modèle", "Model"), d: tr("Probabilité calibrée", "Calibrated probability") },
            { i: Scale, t: tr("Marché", "Market"), d: tr("Comparé au vrai prix", "Compared with the real price") },
            { i: BadgeCheck, t: tr("Preuve", "Proof"), d: tr("Tout est publié", "Everything published") },
          ].map((x, k) => (
            <div key={x.t} className="relative rounded-2xl border border-border bg-card/60 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary"><x.i className="h-5 w-5" /></span>
                <span className="font-mono text-xs text-muted-foreground">0{k + 1}</span>
              </div>
              <div className="font-display text-xl font-bold">{x.t}</div>
              <div className="text-sm text-muted-foreground">{x.d}</div>
              {k < 3 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-background text-muted-foreground md:block" />}
            </div>
          ))}
        </div>
      </section>

      {/* RÉSULTATS EN GRAPHIQUES */}
      <section id="resultats" className="container mx-auto max-w-6xl scroll-mt-20 px-4 pt-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>{tr("Résultats LoL · argent réel", "LoL results · real money")}</Eyebrow>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">{tr("En un coup d'œil.", "At a glance.")}</h2>
          </div>
          <Link to="/track-record" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">{tr("Tout voir", "See everything")} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {s && lol ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card/60 p-5 lg:col-span-2">
              <div className="mb-3 flex items-baseline justify-between">
                <div className="text-sm font-semibold">{tr("Gain cumulé", "Cumulative profit")}</div>
                <div className={`font-display text-3xl font-bold tabular-nums ${s.pnl_usd >= 0 ? "text-emerald-400" : "text-red-400"}`}>{usd(s.pnl_usd, true)}</div>
              </div>
              <PnlChart daily={lol.daily} height={250} />
            </div>
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="mb-3 text-sm font-semibold">{tr("Paris gagnés", "Bets won")}</div>
              <WinDonut won={s.n_won} lost={s.n_lost} />
              <div className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground">
                <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />{s.n_won} {tr("gagnés", "won")}</span>
                <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-red-400" />{s.n_lost} {tr("perdus", "lost")}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="mb-1 text-sm font-semibold">{tr("ROI par mois", "ROI by month")}</div>
              <MonthRoi data={lol.by_month} />
            </div>
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="mb-1 text-sm font-semibold">{tr("ROI par ligue", "ROI by league")}</div>
              <LeagueRoi data={lol.by_league.filter((l) => l.n >= 12)} />
            </div>
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="mb-1 text-sm font-semibold">{tr("Prix payé vs réussite réelle", "Price paid vs actual wins")}</div>
              <PriceVsWin buckets={lol.price_buckets} height={220} />
              <Legend2 a={tr("Prix payé", "Price paid")} b={tr("Réussite réelle", "Actual wins")} />
            </div>
          </div>
        ) : (
          <div className="h-96 animate-pulse rounded-2xl bg-card/60" />
        )}
        {s && <div className="mt-4"><Freshness asof={s.data_asof} generated={man?.generated_utc} /></div>}
      </section>

      {/* PRODUITS */}
      <section id="produits" className="container mx-auto max-w-6xl scroll-mt-20 px-4 pt-20">
        <Eyebrow>{tr("Produits", "Products")}</Eyebrow>
        <h2 className="mb-8 font-display text-4xl font-bold sm:text-5xl">{tr("Ce que nous livrons.", "What we deliver.")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Radar, t: tr("Probabilités", "Probabilities"), d: tr("Qui gagne, et à quel %", "Who wins, and at what %"), to: "/predictions" },
            { i: Sigma, t: tr("Cotes & value bets", "Odds & value bets"), d: tr("Modèle vs prix du marché", "Model vs market price"), to: "/track-record#details" },
            { i: BarChart3, t: tr("Jeux de données", "Datasets"), d: "CSV · JSON", to: "/track-record#verification" },
            { i: Braces, t: "API", d: tr("Sur demande", "On request"), to: "/about#contact" },
          ].map((p) => (
            <Link key={p.t} to={p.to} className="group rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:border-primary/50">
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-gaming text-background"><p.i className="h-6 w-6" /></span>
              <div className="font-display text-xl font-bold">{p.t}</div>
              <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">{p.d}<ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" /></div>
            </Link>
          ))}
        </div>
      </section>

      {/* COUVERTURE */}
      <section id="couverture" className="container mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <div className="mb-8 max-w-2xl">
          <Eyebrow>{tr("Couverture", "Coverage")}</Eyebrow>
          <h2 className="font-display text-4xl font-bold">{tr("Où on en est.", "Where we stand.")}</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-3 font-medium">{tr("Jeu", "Game")}</th><th className="hidden px-5 py-3 font-medium sm:table-cell">Module</th><th className="px-5 py-3 font-medium">{tr("Statut", "Status")}</th><th className="hidden px-5 py-3 font-medium md:table-cell">{tr("Preuves", "Evidence")}</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.m} className="border-t border-border/60 transition-colors hover:bg-secondary/30">
                  <td className="px-5 py-4 font-semibold">{r.g}</td>
                  <td className="hidden px-5 py-4 text-muted-foreground sm:table-cell">{r.m}</td>
                  <td className="px-5 py-4"><StagePill stage={r.st} /></td>
                  <td className="hidden px-5 py-4 text-muted-foreground md:table-cell">{r.ev}</td>
                  <td className="px-5 py-4 text-right"><Link to={r.to} className="text-primary" aria-label={r.g}><ArrowRight className="inline h-4 w-4" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/15" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold sm:text-5xl">{tr("Parlons de vos besoins.", "Let's talk.")}</h2>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/about#contact"><Button size="lg" className="h-12 px-7">{tr("Contacter l'équipe", "Contact sales")}</Button></Link>
              <Link to="/track-record"><Button size="lg" variant="outline" className="h-12 px-7">{tr("Voir les résultats", "View results")}</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
