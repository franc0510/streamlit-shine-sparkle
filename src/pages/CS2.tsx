import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { CountBars, Reliability, VsMarket } from "@/components/stats/charts";
import { Kpi, Loading, Section, StagePill } from "@/components/stats/parts";
import { VerifyPanel } from "@/components/stats/Verify";
import { Cs2Status, EvalRow, pct, usd, useCs2Status } from "@/lib/stats";
import { useTr } from "@/hooks/useTr";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = ["overview", "details", "verification"];
const useHashTab = () => {
  const read = () => { const h = window.location.hash.slice(1); return TABS.includes(h) ? h : "overview"; };
  const [tab, setTab] = useState(read);
  useEffect(() => { const f = () => setTab(read()); window.addEventListener("hashchange", f); f(); return () => window.removeEventListener("hashchange", f); }, []);
  return [tab, (v: string) => { setTab(v); history.replaceState(null, "", v === "overview" ? window.location.pathname : `#${v}`); }] as const;
};

const SKIP_LABEL: Record<string, [string, string]> = {
  bet: ["Pari papier placé", "Paper bet placed"],
  illiquid_spread: ["Écart acheteur/vendeur trop large", "Bid/ask spread too wide"],
  no_market: ["Pas de marché Polymarket", "No Polymarket market"],
  too_late: ["Trop tard avant le match", "Too close to kick-off"],
  edge_below_min: ["Avantage sous le seuil (3 %)", "Edge below threshold (3%)"],
};

const Row = ({ label, r, best }: { label: string; r: EvalRow | null; best?: boolean }) => (
  <tr className={`border-t border-border/40 ${best ? "bg-primary/5" : ""}`}>
    <td className="px-3 py-2 font-medium">{label}</td>
    <td className="px-3 py-2 text-right tabular-nums">{r ? r.logloss.toFixed(4) : "—"}</td>
    <td className="px-3 py-2 text-right tabular-nums">{r ? r.brier.toFixed(4) : "—"}</td>
    <td className="px-3 py-2 text-right tabular-nums">{r ? pct(r.acc, 1) : "—"}</td>
  </tr>
);

const Body = ({ d }: { d: Cs2Status }) => {
  const { tr, lng } = useTr();
  const v = d.eval.vs_market;
  const reasons = Object.entries(d.skip_reasons).sort((a, b) => b[1] - a[1]);
  const [tab, setTab] = useHashTab();
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={tr("Bankroll fictive", "Virtual bankroll")} value={d.bankroll_virtual_usd == null ? "—" : usd(d.bankroll_virtual_usd)} sub={tr(`départ ${usd(d.bankroll0_usd ?? 50)} · argent fictif`, `start ${usd(d.bankroll0_usd ?? 50)} · play money`)} />
        <Kpi label={tr("Décisions journalisées", "Decisions logged")} value={d.decisions_logged} sub={tr("y compris les non-paris", "including non-bets")} />
        <Kpi label={tr("Paris papier", "Paper bets")} value={d.bets_logged} sub={`${d.open} ${tr("ouverts", "open")} · ${d.settled_bets} ${tr("réglés", "settled")}`} />
        <Kpi label={tr("Période de test", "Test period")} value={d.period ? new Date(d.period[0]).toLocaleDateString(lng, { day: "numeric", month: "short" }) : "—"} sub={tr("depuis le premier run", "since the first run")} />
      </div>
      <div className="mt-4 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
        {tr("Pas de ROI annoncé : trop peu de paris réglés. On juge la qualité des probabilités.", "No ROI claimed: too few settled bets. We judge probability quality.")}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="h-11 w-full justify-start gap-1 rounded-xl bg-secondary/60 p-1 sm:w-auto">
          <TabsTrigger value="overview" className="px-5">{tr("Aperçu", "Overview")}</TabsTrigger>
          <TabsTrigger value="details" className="px-5">{tr("Détails", "Details")}</TabsTrigger>
          <TabsTrigger value="verification" className="px-5">{tr("Vérification", "Verification")}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
      <Section title={tr("Le modèle contre le marché", "Model vs market")} kicker={tr("Évaluation sur séries passées", "Evaluation on past series")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/60 p-5">
            <div className="mb-3 text-sm font-semibold">{tr(`Écart de log-loss vs marché · ${v.n.toLocaleString(lng)} séries`, `Log-loss gap vs market · ${v.n.toLocaleString(lng)} series`)}</div>
            <VsMarket rows={[
              { label: tr("Marché (référence)", "Market (benchmark)"), delta: 0 },
              { label: tr("Notre modèle seul", "Our model alone"), delta: (v.model?.logloss ?? 0) - (v.market?.logloss ?? 0) },
              { label: tr("Modèle + marché", "Model + market"), delta: (v.blend_tier?.logloss ?? 0) - (v.market?.logloss ?? 0), highlight: true },
              { label: tr("… marchés liquides", "… liquid markets"), delta: (v.blend_tier_liq?.logloss ?? 0) - (v.market?.logloss ?? 0), highlight: true },
            ]} />
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-5">
            <div className="mb-3 text-sm font-semibold">{tr("Fiabilité : annoncé vs observé", "Reliability: predicted vs observed")}</div>
            <Reliability bins={d.eval.reliability} />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-3 py-2 text-left" /><th className="px-3 py-2 text-right">Log-loss</th><th className="px-3 py-2 text-right">Brier</th><th className="px-3 py-2 text-right">{tr("Justesse", "Accuracy")}</th></tr>
            </thead>
            <tbody>
              <Row label={tr("Marché", "Market")} r={v.market} />
              <Row label={tr("Modèle seul", "Model alone")} r={v.model} />
              <Row label={tr("Modèle + marché", "Model + market")} r={v.blend_tier} best />
            </tbody>
          </table>
        </div>
      </Section>

        </TabsContent>
        <TabsContent value="details">
      <Section title={tr("Pourquoi si peu de paris ?", "Why so few bets?")} kicker={tr("Garde-fous", "Safeguards")}>
        <div className="max-w-2xl rounded-2xl border border-border bg-card/60 p-5">
          <CountBars rows={reasons.map(([k, n]) => ({ label: SKIP_LABEL[k] ? tr(...SKIP_LABEL[k]) : k, n, highlight: k === "bet" }))} />
        </div>
      </Section>

      <Section title={tr("Santé des données", "Data health")} kicker={tr("Contrôles automatiques", "Automatic checks")}>
        <ul className="grid gap-2 sm:grid-cols-2">
          {d.data_checks.map((c) => (
            <li key={c.check} className="flex items-start gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-sm">
              {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />}
              <span><b>{c.check}</b> <span className="text-muted-foreground">— {c.detail}</span></span>
            </li>
          ))}
        </ul>
      </Section>
        </TabsContent>
        <TabsContent value="verification">
          <Section title={tr("Sources et vérification", "Sources and verification")} kicker={tr("Transparence", "Transparency")}>
            <VerifyPanel />
          </Section>
        </TabsContent>
      </Tabs>
    </>
  );
};

const CS2 = () => {
  const { tr } = useTr();
  const { data, isLoading, error } = useCs2Status();
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="CS2 en test — paper trading public | PredictEsport"
        description="Notre modèle Counter-Strike 2 est en phase de test : paper trading quotidien, journal public des décisions et comparaison honnête avec le prix du marché."
        path="/cs2"
      />
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <StagePill stage="test" />
          <span className="text-sm text-muted-foreground">Counter-Strike 2 · Polymarket</span>
        </div>
        <h1 className="mb-3 font-display text-4xl font-bold sm:text-5xl">{tr("CS2 : en phase de test", "CS2: in testing")}</h1>
        <p className="mb-8 max-w-2xl text-muted-foreground">{tr("Argent fictif. Journal public, même quand il ne mise pas.", "Play money. Public log, even when it doesn't bet.")}</p>
        {isLoading && <Loading />}
        {error && <p className="text-red-400">{tr("Données indisponibles.", "Data unavailable.")}</p>}
        {data && <Body d={data} />}
      </main>
      <Footer />
    </div>
  );
};

export default CS2;
