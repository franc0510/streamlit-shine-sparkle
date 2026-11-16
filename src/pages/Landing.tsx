import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
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

const Feature = ({ eyebrow, title, body, bullets, cta, to, visual, flip }: { eyebrow: string; title: string; body: string; bullets: string[]; cta: string; to: string; visual: ReactNode; flip?: boolean }) => (
  <div className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16">
    <div className={flip ? "lg:order-2" : ""}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h3 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h3>
      <p className="mt-4 text-muted-foreground">{body}</p>
      <ul className="mt-5 space-y-2.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{b}</li>
        ))}
      </ul>
      <Link to={to} className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">{cta} <ArrowRight className="h-4 w-4" /></Link>
    </div>
    <div className={flip ? "lg:order-1" : ""}>{visual}</div>
  </div>
);

// Exemple réel : dernière prédiction « ok » de Documents/predictions_history.csv (dépôt LoL)
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
              {tr("La donnée esport", "Esports data you")}{" "}
              <span className="bg-gradient-gaming bg-clip-text text-transparent">{tr("dont vous pouvez vérifier la source.", "can trace to the source.")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {tr(
                "Probabilités de victoire, cotes et value bets pour l'esport. Chaque statistique est recalculée automatiquement depuis notre code et peut être auditée.",
                "Win probabilities, odds and value bets for esports. Every statistic is recomputed automatically from our code and can be audited.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/about#contact"><Button size="lg" className="h-12 px-6">{tr("Demander un accès", "Request access")}</Button></Link>
              <Link to="/track-record"><Button size="lg" variant="outline" className="h-12 gap-2 px-6">{tr("Voir les résultats", "View results")} <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-accent" />{tr("Aucun chiffre saisi à la main · empreintes SHA-256 · tous les paris publiés", "No hand-typed figure · SHA-256 fingerprints · every bet published")}</div>
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

      {/* PRODUITS */}
      <section id="produits" className="container mx-auto max-w-6xl scroll-mt-20 px-4 pt-20">
        <div className="max-w-2xl">
          <Eyebrow>{tr("Produits", "Products")}</Eyebrow>
          <h2 className="font-display text-4xl font-bold sm:text-5xl">{tr("Tout ce qu'il faut pour intégrer la donnée.", "Everything you need to integrate the data.")}</h2>
        </div>

        <Feature
          eyebrow={tr("Probabilités", "Probabilities")}
          title={tr("Des probabilités calibrées pour chaque série.", "Calibrated probabilities for every series.")}
          body={tr("Un ensemble de modèles (LightGBM, XGBoost, CatBoost) calibré par ligue et par format, qui sort une probabilité de victoire pour chaque match à venir.", "An ensemble of models (LightGBM, XGBoost, CatBoost) calibrated by league and format, outputting a win probability for every upcoming match.")}
          bullets={[tr("BO1, BO3 et BO5 gérés séparément", "BO1, BO3 and BO5 handled separately"), tr("Historique horodaté de chaque prédiction", "Timestamped history of every prediction"), tr("LCK, LEC, LPL, LCS, Worlds et ligues régionales", "LCK, LEC, LPL, LCS, Worlds and regional leagues")]}
          cta={tr("Voir les prédictions", "See predictions")} to="/predictions"
          visual={
            <Window title="calibration.json">
              <div className="space-y-3 p-5">
                {(cs2?.eval.reliability ?? []).filter((_, i) => i % 1 === 0).slice(1, 9).map((b) => (
                  <div key={b.bin} className="grid grid-cols-[64px_1fr_1fr] items-center gap-3 text-xs">
                    <span className="font-mono text-muted-foreground">{b.bin}</span>
                    <div className="h-2 rounded bg-secondary"><div className="h-2 rounded bg-primary" style={{ width: `${b.p_mean * 100}%` }} /></div>
                    <div className="h-2 rounded bg-secondary"><div className="h-2 rounded bg-accent" style={{ width: `${b.win_rate * 100}%` }} /></div>
                  </div>
                ))}
                <div className="flex gap-4 pt-1 text-[11px] text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-2 rounded bg-primary" />{tr("proba annoncée", "predicted")}</span><span><i className="mr-1 inline-block h-2 w-2 rounded bg-accent" />{tr("fréquence observée", "observed")}</span></div>
              </div>
              <div className="border-t border-border/70 bg-secondary/30 px-5 py-2.5 text-[11px] text-muted-foreground">{tr("Courbe de fiabilité du modèle CS2 · 27 206 séries, évaluation walk-forward", "CS2 model reliability curve · 27,206 series, walk-forward evaluation")}</div>
            </Window>
          }
        />

        <div className="border-t border-border/50" />
        <Feature
          flip
          eyebrow={tr("Cotes & value bets", "Odds & value bets")}
          title={tr("Comparez le modèle au prix du marché.", "Compare the model to the market price.")}
          body={tr("Pour chaque pari : probabilité du modèle, prix d'entrée réel et mise. Aucune marge cachée, le prix retenu est celui du carnet d'ordres.", "For every bet: model probability, real entry price and stake. No hidden margin — the price used is the order book's.")}
          bullets={[tr("Prix d'entrée réel, frais inclus (CS2 papier)", "Real entry price, fees included (CS2 paper)"), tr("Garde-fous de liquidité et de délai", "Liquidity and timing safeguards"), tr("Registre complet, gagnants comme perdants", "Complete ledger, winners and losers alike")]}
          cta={tr("Voir le registre des paris", "View the bet ledger")} to="/track-record#details"
          visual={
            <Window title="ledger.csv">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground"><tr><th className="px-4 py-2 font-medium">{tr("Pari sur", "Bet on")}</th><th className="px-2 py-2 text-right font-medium">{tr("Modèle", "Model")}</th><th className="px-2 py-2 text-right font-medium">{tr("Prix", "Price")}</th><th className="px-4 py-2 text-right font-medium">P&amp;L</th></tr></thead>
                <tbody>
                  {last.map((r) => (
                    <tr key={r.bet_no} className="border-t border-border/50">
                      <td className="px-4 py-2.5"><div className="font-medium">{r.bet_on}</div><div className="text-[11px] text-muted-foreground">{r.league}</div></td>
                      <td className="px-2 text-right tabular-nums">{r.model_prob == null ? "—" : pct(r.model_prob, 0)}</td>
                      <td className="px-2 text-right tabular-nums">{pct(r.entry_price, 0)}</td>
                      <td className={`px-4 text-right font-semibold tabular-nums ${(r.pnl_usd ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{r.pnl_usd == null ? "—" : usd(r.pnl_usd, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-border/70 bg-secondary/30 px-5 py-2.5 text-[11px] text-muted-foreground">{tr("Les 4 derniers paris réglés du registre public", "The 4 latest settled bets of the public ledger")}</div>
            </Window>
          }
        />

        <div className="border-t border-border/50" />
        <Feature
          eyebrow={tr("Jeux de données", "Datasets")}
          title={tr("Des fichiers que l'on peut auditer.", "Files you can audit.")}
          body={tr("Historiques de prédictions, séries de cotes et registre des paris, livrés en CSV et JSON. Chaque fichier est empreint en SHA-256 et rattaché au commit qui l'a produit.", "Prediction histories, odds series and the bet ledger, delivered as CSV and JSON. Each file is SHA-256 fingerprinted and tied to the commit that produced it.")}
          bullets={[tr("Régénération automatique toutes les 6 heures", "Automatic regeneration every 6 hours"), tr("Manifeste de provenance public", "Public provenance manifest"), tr("Vérification d'intégrité en un clic", "One-click integrity check")]}
          cta={tr("Voir la vérification", "See verification")} to="/track-record#verification"
          visual={
            <Window title="manifest.json">
              <div className="divide-y divide-border/50 font-mono text-xs">
                {(man?.outputs ?? []).map((o) => (
                  <div key={o.path} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span>{o.path.replace("data/", "")}</span>
                    <span className="text-muted-foreground">sha256 {o.sha256.slice(0, 10)}…</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/70 bg-secondary/30 px-5 py-2.5 text-[11px] text-muted-foreground">{man ? `${tr("Généré le", "Generated")} ${new Date(man.generated_utc).toLocaleString(lng, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC` : ""}</div>
            </Window>
          }
        />
      </section>

      {/* COUVERTURE */}
      <section id="couverture" className="container mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <div className="mb-8 max-w-2xl">
          <Eyebrow>{tr("Couverture", "Coverage")}</Eyebrow>
          <h2 className="font-display text-4xl font-bold">{tr("Le vrai statut de chaque module.", "The true status of every module.")}</h2>
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

      {/* TRACK RECORD */}
      <section className="border-y border-border/70 bg-card/30">
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-[1fr_1.35fr]">
          <div>
            <Eyebrow>Track record LoL</Eyebrow>
            <h2 className="font-display text-4xl font-bold">{tr("Des résultats réels, pas un backtest.", "Real results, not a backtest.")}</h2>
            <p className="mt-4 text-muted-foreground">{tr("Paris réels sur Polymarket depuis le 13 août 2026. Chaque pari est dans le registre, avec l'intervalle de confiance du ROI.", "Real-money Polymarket bets since 13 Aug 2026. Every bet is in the ledger, with the ROI's confidence interval.")}</p>
            {s && (
              <dl className="mt-6 grid grid-cols-3 gap-4">
                <div><dt className="text-xs text-muted-foreground">{tr("Résultat", "P&L")}</dt><dd className={`font-display text-2xl font-bold tabular-nums ${s.pnl_usd >= 0 ? "text-emerald-400" : "text-red-400"}`}>{usd(s.pnl_usd, true)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">ROI</dt><dd className="font-display text-2xl font-bold tabular-nums">{pct(s.roi, 1, true)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">{tr("Paris", "Bets")}</dt><dd className="font-display text-2xl font-bold tabular-nums">{s.n_settled}</dd></div>
              </dl>
            )}
            <Link to="/track-record" className="mt-7 inline-block"><Button variant="outline" className="gap-2">{tr("Ouvrir le track record", "Open the track record")} <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
          <div>
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              {lol ? <PnlChart daily={lol.daily} height={280} /> : <div className="h-[280px] animate-pulse rounded bg-secondary/40" />}
            </div>
            {s && <div className="mt-3"><Freshness asof={s.data_asof} generated={man?.generated_utc} /></div>}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/15" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold sm:text-5xl">{tr("Parlons de vos besoins en données esport.", "Let's talk about your esports data needs.")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{tr("Médias, analystes, opérateurs : décrivez votre cas d'usage, nous revenons vers vous avec une proposition.", "Media, analysts, operators: describe your use case and we'll come back with a proposal.")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/about#contact"><Button size="lg" className="h-12 px-7">{tr("Contacter l'équipe", "Contact sales")}</Button></Link>
              <Link to="/pricing"><Button size="lg" variant="outline" className="h-12 px-7">{tr("Voir les tarifs", "View pricing")}</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
