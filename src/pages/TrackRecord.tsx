import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Download, Info } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { LeagueRoi, Legend2, MonthRoi, PriceVsWin, WinDonut } from "@/components/stats/charts";
import { Freshness, Kpi, Loading, PnlChart, Section, StagePill } from "@/components/stats/parts";
import { VerifyPanel } from "@/components/stats/Verify";
import { LedgerRow, pct, shortDate, usd, useLedger, useLolTrack, useManifest } from "@/lib/stats";
import { useTr } from "@/hooks/useTr";

const PAGE = 20;
const TABS = ["overview", "details", "verification"] as const;
const useHashTab = () => {
  const read = () => { const h = window.location.hash.slice(1); return (TABS as readonly string[]).includes(h) ? h : "overview"; };
  const [tab, setTab] = useState(read);
  useEffect(() => { const f = () => setTab(read()); window.addEventListener("hashchange", f); f(); return () => window.removeEventListener("hashchange", f); }, []);
  const set = (v: string) => { setTab(v); history.replaceState(null, "", v === "overview" ? window.location.pathname : `#${v}`); };
  return [tab, set] as const;
};

const Ledger = () => {
  const { tr, lng } = useTr();
  const { data, isLoading } = useLedger();
  const [league, setLeague] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const leagues = useMemo(() => [...new Set((data ?? []).map((r) => r.league))].sort(), [data]);
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => (league === "all" || r.league === league) && (status === "all" || r.status === status) &&
        (!ql || r.market.toLowerCase().includes(ql) || r.bet_on.toLowerCase().includes(ql)))
      .sort((a, b) => b.bet_no - a.bet_no);
  }, [data, league, status, q]);
  if (isLoading) return <Loading />;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const sel = "h-9 rounded-md border border-border bg-background px-2 text-sm";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className={sel + " w-48"} placeholder={tr("Rechercher une équipe…", "Search a team…")} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="search" />
        <select className={sel} value={league} onChange={(e) => { setLeague(e.target.value); setPage(0); }} aria-label="league">
          <option value="all">{tr("Toutes les ligues", "All leagues")}</option>
          {leagues.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select className={sel} value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="status">
          <option value="all">{tr("Tous les résultats", "All results")}</option>
          <option value="won">{tr("Gagnés", "Won")}</option>
          <option value="lost">{tr("Perdus", "Lost")}</option>
        </select>
        <a href="/data/lol_ledger.csv" download className="ml-auto">
          <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" />CSV</Button>
        </a>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">#</th><th className="px-3 py-2">{tr("Date", "Date")}</th><th className="px-3 py-2">{tr("Ligue", "League")}</th>
              <th className="px-3 py-2">{tr("Pari sur", "Bet on")}</th><th className="px-3 py-2">{tr("Match", "Match")}</th>
              <th className="px-3 py-2 text-right">{tr("Prix", "Price")}</th><th className="px-3 py-2 text-right">{tr("Mise", "Stake")}</th>
              <th className="px-3 py-2 text-right">P&amp;L</th><th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {view.map((r: LedgerRow) => (
              <tr key={r.bet_no} className="border-t border-border/40">
                <td className="px-3 py-2 text-muted-foreground tabular-nums">{r.bet_no}</td>
                <td className="whitespace-nowrap px-3 py-2">{shortDate(r.event_date, lng)}</td>
                <td className="px-3 py-2">{r.league}</td>
                <td className="px-3 py-2 font-medium">{r.bet_on}</td>
                <td className="max-w-[260px] truncate px-3 py-2 text-muted-foreground" title={r.market}>{r.market}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.entry_price.toFixed(2)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{usd(r.stake_usd)}</td>
                <td className={`px-3 py-2 text-right font-semibold tabular-nums ${r.status === "won" ? "text-emerald-400" : r.status === "lost" ? "text-red-400" : ""}`}>
                  {r.pnl_usd == null ? "—" : usd(r.pnl_usd, true)}
                </td>
                <td className="px-3 py-2 text-right">
                  <a className="text-xs text-primary hover:underline" target="_blank" rel="noreferrer" href={`https://polymarket.com/event/${r.polymarket_slug}`}>Polymarket ↗</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>{rows.length} {tr("paris", "bets")}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>←</Button>
          <span>{page + 1} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>→</Button>
        </div>
      </div>
    </div>
  );
};

const Bars = ({ items, max }: { items: { label: string; value: number; sub: string }[]; max: number }) => (
  <ul className="space-y-2">
    {items.map((i) => (
      <li key={i.label} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm">
        <span className="truncate">{i.label}</span>
        <div className="relative h-5 rounded bg-secondary/60">
          <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
          <div
            className={`absolute inset-y-0 rounded ${i.value >= 0 ? "left-1/2 bg-emerald-500/70" : "right-1/2 bg-red-500/70"}`}
            style={{ width: `${Math.min(50, (Math.abs(i.value) / max) * 50)}%` }}
          />
        </div>
        <span className="w-40 text-right text-xs tabular-nums text-muted-foreground">{i.sub}</span>
      </li>
    ))}
  </ul>
);

const TrackRecord = () => {
  const { tr, lng } = useTr();
  const { data, isLoading, error } = useLolTrack();
  const { data: manifest } = useManifest();
  const [tab, setTab] = useHashTab();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Track record LoL vérifiable — PredictEsport"
        description="Résultats réels et auditables de nos paris League of Legends depuis le 13 août 2026 : courbe, ROI, intervalle de confiance, registre complet et empreintes SHA-256."
        path="/track-record"
      />
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <StagePill stage="live" />
          <span className="text-sm text-muted-foreground">League of Legends · Polymarket · {tr("depuis le 13 août 2026", "since 13 Aug 2026")}</span>
        </div>
        <h1 className="mb-3 font-display text-4xl font-bold sm:text-5xl">{tr("Track record LoL", "LoL track record")}</h1>
        <p className="mb-6 max-w-2xl text-muted-foreground">{tr("Argent réel. Tous les paris, gagnants et perdants.", "Real money. Every bet, winners and losers.")}</p>

        {isLoading && <Loading />}
        {error && <p className="text-red-400">{tr("Données indisponibles.", "Data unavailable.")}</p>}
        {data && (() => {
          const s = data.summary;
          const sig = s.roi_ci95 && s.roi_ci95[0] > 0;
          return (
            <>
              <Freshness
                asof={s.data_asof}
                generated={manifest?.generated_utc}
                extra={
                  s.unreconciled_bets_after_asof > 0 && (
                    <>
                      {tr(
                        `${s.unreconciled_bets_after_asof} paris (${usd(s.unreconciled_stake_usd)} misés) ont été passés après cette date : ils ne sont pas comptés tant que l'historique du wallet n'est pas resynchronisé.`,
                        `${s.unreconciled_bets_after_asof} bets (${usd(s.unreconciled_stake_usd)} staked) were placed after this date: they are excluded until the wallet history is re-synced.`,
                      )}
                    </>
                  )
                }
              />

              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label={tr("Résultat cumulé", "Cumulative P&L")} value={usd(s.pnl_usd, true)} tone={s.pnl_usd >= 0 ? "pos" : "neg"} sub={`${s.n_settled} ${tr("paris réglés", "settled bets")}`} />
                <Kpi label="ROI" value={pct(s.roi, 1, true)} tone={s.roi >= 0 ? "pos" : "neg"}
                  sub={s.roi_ci95 ? `IC 95 % : ${pct(s.roi_ci95[0], 0, true)} → ${pct(s.roi_ci95[1], 0, true)}` : undefined} />
                <Kpi label={tr("Taux de réussite", "Win rate")} value={pct(s.win_rate, 1)} sub={`${s.n_won} ${tr("gagnés", "won")} · ${s.n_lost} ${tr("perdus", "lost")}`} />
                <Kpi label={tr("Total misé", "Total staked")} value={usd(s.stake_usd)} sub={`${tr("mise moyenne", "avg stake")} ${usd(s.avg_stake_usd)}`} />
              </div>

              <div className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${sig ? "border-emerald-500/30" : "border-border"} bg-card/50`}>
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-muted-foreground">
                  {sig
                    ? tr("Intervalle de confiance à 95 % du ROI entièrement positif.", "95% ROI confidence interval entirely positive.")
                    : tr(`Échantillon encore petit (${s.n_settled} paris) : l'intervalle de confiance du ROI inclut zéro.`, `Sample still small (${s.n_settled} bets): the ROI confidence interval includes zero.`)}
                </p>
              </div>

              <Tabs value={tab} onValueChange={setTab} className="mt-8">
                <TabsList className="h-11 w-full justify-start gap-1 rounded-xl bg-secondary/60 p-1 sm:w-auto">
                  <TabsTrigger value="overview" className="px-5">{tr("Aperçu", "Overview")}</TabsTrigger>
                  <TabsTrigger value="details" className="px-5">{tr("Détails", "Details")}</TabsTrigger>
                  <TabsTrigger value="verification" className="px-5">{tr("Vérification", "Verification")}</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card/60 p-5 lg:col-span-2">
                  <div className="mb-3 text-sm font-semibold">{tr("Gain cumulé ($)", "Cumulative profit ($)")}</div>
                  <PnlChart daily={data.daily} />
                  <div className="mt-2 text-xs text-muted-foreground">{tr("Plus grosse baisse depuis un sommet", "Largest drop from a peak")} : <b>{usd(s.max_drawdown_usd)}</b></div>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-5">
                  <div className="mb-3 text-sm font-semibold">{tr("Paris gagnés", "Bets won")}</div>
                  <WinDonut won={s.n_won} lost={s.n_lost} size={200} />
                  <div className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground">
                    <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />{s.n_won}</span>
                    <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-red-400" />{s.n_lost}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-5">
                  <div className="mb-1 text-sm font-semibold">{tr("ROI par mois", "ROI by month")}</div>
                  <MonthRoi data={data.by_month} />
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-5 lg:col-span-2">
                  <div className="mb-1 text-sm font-semibold">{tr("ROI par ligue (≥ 8 paris)", "ROI by league (≥ 8 bets)")}</div>
                  <LeagueRoi data={data.by_league.filter((l) => l.n >= 8)} />
                </div>
              </div>

                </TabsContent>
                <TabsContent value="details">
              <Section title={tr("Le modèle bat-il le prix ?", "Does the model beat the price?")} kicker={tr("Calibration", "Calibration")}>
                <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-2xl border border-border bg-card/60 p-5">
                    <PriceVsWin buckets={data.price_buckets} />
                    <Legend2 a={tr("Prix payé (proba du marché)", "Price paid (market probability)")} b={tr("Réussite réelle", "Actual win rate")} />
                  </div>
                  <div className="grid gap-3">
                    <Kpi label={tr("Prix moyen payé", "Average price paid")} value={pct(data.calibration.implied_win_rate, 1)} />
                    <Kpi label={tr("Réussite réelle", "Actual win rate")} value={pct(data.calibration.actual_win_rate, 1)} tone={data.calibration.actual_win_rate >= data.calibration.implied_win_rate ? "pos" : "neg"} />
                    <Kpi label={tr("Proba moyenne du modèle", "Avg model probability")} value={data.calibration.avg_model_prob == null ? "—" : pct(data.calibration.avg_model_prob, 1)} />
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr><th className="px-3 py-2 text-left">{tr("Tranche de prix", "Price bucket")}</th><th className="px-3 py-2 text-right">{tr("Paris", "Bets")}</th><th className="px-3 py-2 text-right">{tr("Prix moyen", "Avg price")}</th><th className="px-3 py-2 text-right">{tr("Réussite", "Win rate")}</th><th className="px-3 py-2 text-right">P&amp;L</th></tr>
                    </thead>
                    <tbody>
                      {data.price_buckets.map((b) => (
                        <tr key={b.range} className="border-t border-border/40">
                          <td className="px-3 py-2">{b.range}</td><td className="px-3 py-2 text-right tabular-nums">{b.n}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{pct(b.avg_price, 0)}</td><td className="px-3 py-2 text-right tabular-nums">{pct(b.win_rate, 0)}</td>
                          <td className={`px-3 py-2 text-right tabular-nums ${b.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{usd(b.pnl, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title={tr("Registre complet des paris", "Full bet ledger")} kicker={tr("Preuve", "Proof")}>
                <Ledger />
              </Section>

                </TabsContent>
                <TabsContent value="verification">
              <Section title={tr("Vérifier ces chiffres", "Verify these numbers")} kicker={tr("Transparence", "Transparency")}>
                <VerifyPanel />
              </Section>

                </TabsContent>
              </Tabs>

              <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-5 text-xs text-muted-foreground">
                <b className="text-foreground">{tr("Avertissement.", "Disclaimer.")}</b>{" "}{tr("Performances passées ≠ résultats futurs. Risque de perte en capital.", "Past performance ≠ future results. Risk of capital loss.")}{" "}
                <Link to="/labs" className="text-primary hover:underline">{tr("Ce qui est en développement →", "What we are building →")}</Link>
              </div>
            </>
          );
        })()}
      </main>
      <Footer />
    </div>
  );
};

export default TrackRecord;
