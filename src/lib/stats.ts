import { useQuery } from "@tanstack/react-query";

/** Formes des fichiers produits par scripts/build_stats.py (public/data/*.json). */
export interface LolSummary {
  start: string;
  data_asof: string;
  n_markets_total: number;
  n_settled: number;
  n_pending: number;
  n_won: number;
  n_lost: number;
  win_rate: number;
  stake_usd: number;
  pnl_usd: number;
  roi: number;
  roi_ci95: [number, number] | null;
  avg_stake_usd: number;
  max_drawdown_usd: number;
  best_bet_usd: number;
  worst_bet_usd: number;
  unreconciled_bets_after_asof: number;
  unreconciled_stake_usd: number;
  predictions_published_since_start: number;
  predictions_ok_since_start: number;
  predictions_published_before_kickoff_share: number | null;
}
export interface DailyPoint {
  date: string;
  pnl: number;
  stake: number;
  n: number;
  cum_pnl: number;
  cum_stake: number;
  cum_n: number;
  roi: number | null;
}
export interface LolTrack {
  summary: LolSummary;
  calibration: { avg_entry_price: number; implied_win_rate: number; actual_win_rate: number; avg_model_prob: number | null; n_with_model_prob: number };
  price_buckets: { range: string; n: number; avg_price: number; win_rate: number; pnl: number }[];
  daily: DailyPoint[];
  by_league: { league: string; n: number; stake: number; pnl: number; roi: number; win_rate: number }[];
  by_month: { month: string; n: number; stake: number; pnl: number; roi: number }[];
}
export interface EvalRow { n: number; logloss: number; brier: number; acc: number }
export interface Cs2Status {
  mode: string;
  stage: string;
  bankroll_virtual_usd: number | null;
  bankroll0_usd: number | null;
  period: [string, string] | null;
  decisions_logged: number;
  bets_logged: number;
  open: number;
  settled_bets: number;
  skip_reasons: Record<string, number>;
  report_generated_utc: string | null;
  last_build_run_date: string | null;
  data_ok: boolean;
  data_checks: { check: string; ok: boolean; detail: string }[];
  last_finished_match_utc: string | null;
  eval: {
    variant: string;
    period: [string, string];
    n_series: number | null;
    vs_market: { n: number; market: EvalRow | null; model: EvalRow | null; blend_tier: EvalRow | null; blend_tier_liq: EvalRow | null };
    reliability: { bin: string; n: number; p_mean: number; win_rate: number }[];
  };
  config: Record<string, unknown> | null;
  note: string | null;
}
export interface Manifest {
  generated_utc: string;
  rules: string[];
  files: { id: string; role: string; sha256: string; bytes: number; last_update: string }[];
  outputs: { path: string; sha256: string; bytes: number }[];
}
export interface LedgerRow {
  bet_no: number; event_date: string; league: string; market: string; bet_on: string;
  entry_price: number; stake_usd: number; payout_usd: number | null; pnl_usd: number | null;
  status: "won" | "lost" | "pending"; model_prob: number | null; decision_price: number | null;
  polymarket_slug: string;
}

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(`${path}?v=${Math.floor(Date.now() / 600000)}`, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

const opts = { staleTime: 5 * 60 * 1000, retry: 1 } as const;
export const useLolTrack = () => useQuery({ queryKey: ["lol-track"], queryFn: () => getJson<LolTrack>("/data/lol_track_record.json"), ...opts });
export const useCs2Status = () => useQuery({ queryKey: ["cs2-status"], queryFn: () => getJson<Cs2Status>("/data/cs2_status.json"), ...opts });
export const useManifest = () => useQuery({ queryKey: ["manifest"], queryFn: () => getJson<Manifest>("/data/manifest.json"), ...opts });

/** CSV minimal (champs entre guillemets gérés). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { f += '"'; i++; }
      else if (c === '"') q = false;
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { cur.push(f); f = ""; }
    else if (c === "\n") { cur.push(f); rows.push(cur); cur = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || cur.length) { cur.push(f); rows.push(cur); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

export const useLedger = () =>
  useQuery({
    queryKey: ["lol-ledger"],
    queryFn: async (): Promise<LedgerRow[]> => {
      const r = await fetch(`/data/lol_ledger.csv?v=${Math.floor(Date.now() / 600000)}`);
      if (!r.ok) throw new Error("ledger");
      return parseCsv(await r.text()).map((x) => ({
        bet_no: +x.bet_no, event_date: x.event_date, league: x.league, market: x.market, bet_on: x.bet_on,
        entry_price: +x.entry_price, stake_usd: +x.stake_usd,
        payout_usd: x.payout_usd === "" ? null : +x.payout_usd, pnl_usd: x.pnl_usd === "" ? null : +x.pnl_usd,
        status: x.status as LedgerRow["status"],
        model_prob: x.model_prob === "" ? null : +x.model_prob, decision_price: x.decision_price === "" ? null : +x.decision_price,
        polymarket_slug: x.polymarket_slug,
      }));
    },
    ...opts,
  });

// ---------- formatage
export const usd = (v: number, signed = false) =>
  `${signed && v > 0 ? "+" : ""}${v < 0 ? "−" : ""}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const pct = (v: number, d = 1, signed = false) =>
  `${signed && v > 0 ? "+" : ""}${v < 0 ? "−" : ""}${(Math.abs(v) * 100).toFixed(d)}%`;
export const shortDate = (iso: string, lng: string) =>
  new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso).toLocaleDateString(lng, { day: "numeric", month: "short", timeZone: "UTC" });
export const daysSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86400000;
