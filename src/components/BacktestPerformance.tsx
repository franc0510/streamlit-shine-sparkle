import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

/* -------------------------------------------------------------------------- */
/*  Config                                                                     */
/* -------------------------------------------------------------------------- */

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/franc0510/streamlit-shine-sparkle/main/public/Documents";

const START_BANKROLL = 10000;

// Couleurs de la charte (recharts ne lit pas les classes Tailwind)
const FLAT_COLOR = "hsl(var(--accent))"; // cyan — Mise fixe (flat 1%)
const KELLY_COLOR = "hsl(var(--primary))"; // or — Kelly borné 1-2%

const EDGE_VALUES = ["0", "5", "10"] as const;

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface BankrollRow {
  month: string;
  edge: string;
  bet_type: string;
  bankroll_eur: number;
  plusvalue_eur: number;
  monthly_growth_pct: number;
  n_bets: number;
}

interface ChartPoint {
  month: string;
  flat: number | null;
  kelly: number | null;
}

interface BetRow {
  date: string;
  month: string;
  league: string;
  edge: string;
  bet_type: string;
  match: string;
  bet_on: string;
  odds: number;
  model_prob: number;
  edge_value: number;
  stake_eur: number;
  won: boolean;
  profit_eur: number;
  bankroll_after_eur: number;
}

/* -------------------------------------------------------------------------- */
/*  CSV helpers (parse simple : split \n / ,)                                  */
/* -------------------------------------------------------------------------- */

const fetchCSV = async (filename: string): Promise<string> => {
  const url = `${GITHUB_RAW_BASE}/${filename}?t=${Date.now()}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "text/plain" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
  return res.text();
};

const buildColMap = (header: string): Record<string, number> => {
  const col: Record<string, number> = {};
  header.split(",").forEach((h, i) => {
    col[h.trim()] = i;
  });
  return col;
};

const num = (v: string | undefined): number => {
  if (v === undefined) return 0;
  const n = parseFloat(v.trim());
  return isNaN(n) ? 0 : n;
};

const parseBankroll = (text: string): BankrollRow[] => {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const col = buildColMap(lines[0]);
  return lines.slice(1).map((line) => {
    const c = line.split(",");
    return {
      month: (c[col["month"]] ?? "").trim(),
      edge: (c[col["edge"]] ?? "").trim(),
      bet_type: (c[col["bet_type"]] ?? "").trim(),
      bankroll_eur: num(c[col["bankroll_eur"]]),
      plusvalue_eur: num(c[col["plusvalue_eur"]]),
      monthly_growth_pct: num(c[col["monthly_growth_pct"]]),
      n_bets: num(c[col["n_bets"]]),
    };
  });
};

const parseBets = (text: string): BetRow[] => {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const col = buildColMap(lines[0]);
  return lines.slice(1).map((line) => {
    const c = line.split(",");
    const won = (c[col["won"]] ?? "").trim().toLowerCase();
    return {
      date: (c[col["date"]] ?? "").trim(),
      month: (c[col["month"]] ?? "").trim(),
      league: (c[col["league"]] ?? "").trim(),
      edge: (c[col["edge"]] ?? "").trim(),
      bet_type: (c[col["bet_type"]] ?? "").trim(),
      match: (c[col["match"]] ?? "").trim(),
      bet_on: (c[col["bet_on"]] ?? "").trim(),
      odds: num(c[col["odds"]]),
      model_prob: num(c[col["model_prob"]]),
      edge_value: num(c[col["edge_value"]]),
      stake_eur: num(c[col["stake_eur"]]),
      won: won === "true" || won === "1",
      profit_eur: num(c[col["profit_eur"]]),
      bankroll_after_eur: num(c[col["bankroll_after_eur"]]),
    };
  });
};

// Compte les matchs analysés (status=='ok') par mois 2026 depuis predictions_history.csv
const parseMatchCounts = (text: string): Record<string, number> => {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return {};
  const col = buildColMap(lines[0]);
  const di = col["match_date_utc"];
  const si = col["status"];
  const out: Record<string, number> = {};
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(",");
    if (si !== undefined && (c[si] ?? "").trim() !== "ok") continue;
    const d = (c[di] ?? "").trim();
    if (d.length < 7) continue;
    const m = d.slice(0, 7);
    if (!m.startsWith("2026")) continue;
    out[m] = (out[m] || 0) + 1;
  }
  return out;
};

/* -------------------------------------------------------------------------- */
/*  i18n locale mapping                                                        */
/* -------------------------------------------------------------------------- */

const INTL_LOCALE: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export const BacktestPerformance = () => {
  const { t, i18n } = useTranslation();

  const [bankrollRows, setBankrollRows] = useState<BankrollRow[] | null>(null);
  const [betRows, setBetRows] = useState<BetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [edge, setEdge] = useState("5");

  const [expanded, setExpanded] = useState(false);
  const [matchCounts, setMatchCounts] = useState<Record<string, number> | null>(
    null
  );
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [bankroll, setBankroll] = useState(1000);

  /* --- formatteurs localisés --- */
  const locale = useMemo(
    () => INTL_LOCALE[(i18n.language || "fr").split("-")[0]] || "fr-FR",
    [i18n.language]
  );
  const eur0 = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    [locale]
  );
  const eur2 = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }),
    [locale]
  );
  const eurCompact = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [locale]
  );
  const pctFmt = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 1,
        signDisplay: "always",
      }),
    [locale]
  );

  const formatMonth = useMemo(
    () => (month: string) => {
      const [y, m] = month.split("-");
      const idx = parseInt(m, 10) - 1;
      if (isNaN(idx)) return month;
      return new Date(Number(y), idx, 1).toLocaleDateString(locale, {
        month: "short",
        year: "numeric",
      });
    },
    [locale]
  );

  const formatBetDate = useMemo(
    () => (date: string) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      return d.toLocaleDateString(locale, { day: "2-digit", month: "short" });
    },
    [locale]
  );

  const edgeLabel = (v: string) =>
    v === "0"
      ? t("backtest.edge0")
      : v === "5"
      ? t("backtest.edge5")
      : t("backtest.edge10");

  /* --- chargement initial (bankroll + bets) --- */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [bankrollText, betsText] = await Promise.all([
          fetchCSV("counter_backtest_bankroll.csv"),
          fetchCSV("counter_backtest_bets.csv").catch(() => ""),
        ]);
        if (cancelled) return;
        const bank = parseBankroll(bankrollText);
        if (bank.length === 0) {
          setFailed(true);
        } else {
          setBankrollRows(bank);
          setBetRows(betsText ? parseBets(betsText) : []);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* --- couverture : chargée à la première ouverture du volet (lazy) --- */
  useEffect(() => {
    if (!expanded || matchCounts !== null) return;
    let cancelled = false;
    fetchCSV("predictions_history.csv")
      .then((txt) => {
        if (!cancelled) setMatchCounts(parseMatchCounts(txt));
      })
      .catch(() => {
        if (!cancelled) setMatchCounts({});
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, matchCounts]);

  /* --- données du graphe pour l'edge sélectionné --- */
  const { chartData, flatFinal, kellyFinal } = useMemo(() => {
    const empty = {
      chartData: [] as ChartPoint[],
      flatFinal: 0,
      kellyFinal: 0,
    };
    if (!bankrollRows) return empty;

    const forEdge = bankrollRows.filter((r) => r.edge === edge);
    if (forEdge.length === 0) return empty;

    const flat = forEdge
      .filter((r) => r.bet_type === "flat")
      .sort((a, b) => a.month.localeCompare(b.month));
    const kelly = forEdge
      .filter((r) => r.bet_type === "kelly_bounded")
      .sort((a, b) => a.month.localeCompare(b.month));

    const months = Array.from(new Set(forEdge.map((r) => r.month))).sort(
      (a, b) => a.localeCompare(b)
    );

    const flatByMonth = new Map(flat.map((r) => [r.month, r.bankroll_eur]));
    const kellyByMonth = new Map(kelly.map((r) => [r.month, r.bankroll_eur]));

    const data: ChartPoint[] = [
      { month: t("backtest.start"), flat: START_BANKROLL, kelly: START_BANKROLL },
    ];
    months.forEach((m) => {
      data.push({
        month: formatMonth(m),
        flat: flatByMonth.get(m) ?? null,
        kelly: kellyByMonth.get(m) ?? null,
      });
    });

    const flatFinal = flat.length ? flat[flat.length - 1].bankroll_eur : 0;
    const kellyFinal = kelly.length ? kelly[kelly.length - 1].bankroll_eur : 0;

    return { chartData: data, flatFinal, kellyFinal };
  }, [bankrollRows, edge, formatMonth, t]);

  /* --- stats agrégées (contexte + couverture par mois) --- */
  const stats = useMemo(() => {
    if (!bankrollRows) return null;
    const flatRows = bankrollRows
      .filter((r) => r.edge === edge && r.bet_type === "flat")
      .sort((a, b) => a.month.localeCompare(b.month));
    if (flatRows.length === 0) return null;
    const totalBets = flatRows.reduce((s, r) => s + r.n_bets, 0);
    const bets = betRows.filter((b) => b.edge === edge && b.bet_type === "flat");
    const wins = bets.filter((b) => b.won).length;
    const winRate = bets.length ? Math.round((wins / bets.length) * 100) : null;
    return {
      firstMonth: flatRows[0].month,
      lastMonth: flatRows[flatRows.length - 1].month,
      totalBets,
      winRate,
      monthlyBets: flatRows, // { month, n_bets }
    };
  }, [bankrollRows, betRows, edge]);

  /* --- mois disponibles pour le navigateur pari-par-pari (stratégie Kelly) --- */
  const betMonths = useMemo(() => {
    const ms = Array.from(
      new Set(
        betRows
          .filter((b) => b.edge === edge && b.bet_type === "kelly_bounded")
          .map((b) => b.month)
      )
    ).sort((a, b) => b.localeCompare(a)); // récent -> ancien
    return ms;
  }, [betRows, edge]);

  const effectiveMonth =
    selectedMonth && betMonths.includes(selectedMonth)
      ? selectedMonth
      : betMonths[0] ?? null;

  // Paris Kelly du mois, avec mise/gain recalculés pour la bankroll de l'utilisateur.
  // Kelly borné 1-2% : la mise est un % de la bankroll → on applique ce même % à la bankroll saisie.
  const monthBets = useMemo(() => {
    if (!effectiveMonth) return [];
    return betRows
      .filter(
        (b) =>
          b.edge === edge &&
          b.bet_type === "kelly_bounded" &&
          b.month === effectiveMonth
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((b) => {
        const bkBefore = b.bankroll_after_eur - b.profit_eur;
        const pct = bkBefore > 0 ? b.stake_eur / bkBefore : 0;
        const userStake = pct * bankroll;
        const userProfit = b.won ? userStake * (b.odds - 1) : -userStake;
        return { ...b, pct, userStake, userProfit };
      });
  }, [betRows, edge, effectiveMonth, bankroll]);

  const bestFinal = Math.max(flatFinal, kellyFinal);

  const strategies = [
    {
      key: "flat",
      name: t("backtest.strategyFlat"),
      color: FLAT_COLOR,
      tint: "text-accent",
      final: flatFinal,
    },
    {
      key: "kelly",
      name: t("backtest.strategyKelly"),
      color: KELLY_COLOR,
      tint: "text-primary",
      final: kellyFinal,
    },
  ];

  /* --- rendu : rien tant que ça charge ou en cas d'échec --- */
  if (loading || failed || !bankrollRows || chartData.length <= 1) return null;

  return (
    <section className="mb-8 animate-fade-in">
      <div className="bg-gradient-card border border-border/50 rounded-xl p-4 sm:p-6">
        {/* En-tête */}
        <div className="text-center mb-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold mb-2">
            {t("backtest.title", {
              start: eur0.format(START_BANKROLL),
              final: eur0.format(bestFinal),
            })
              .split("→")
              .map((part, i) =>
                i === 0 ? (
                  <span key={i} className="text-foreground">
                    {part}
                    <span className="text-muted-foreground">→</span>
                  </span>
                ) : (
                  <span
                    key={i}
                    className="bg-gradient-gaming bg-clip-text text-transparent"
                  >
                    {part}
                  </span>
                )
              )}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
            {t("backtest.subtitle")}
          </p>
        </div>

        {/* Sélecteur d'edge */}
        <div className="flex justify-center mb-4">
          <Tabs value={edge} onValueChange={setEdge}>
            <TabsList>
              {EDGE_VALUES.map((v) => (
                <TabsTrigger key={v} value={v}>
                  {edgeLabel(v)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Bandeau contexte (crédibilité) */}
        {stats && (
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>
              {formatMonth(stats.firstMonth)} – {formatMonth(stats.lastMonth)}
            </span>
            <span className="text-border">·</span>
            <span>{t("backtest.betsTracked", { count: stats.totalBets })}</span>
            {stats.winRate != null && (
              <>
                <span className="text-border">·</span>
                <span>{t("backtest.winRate", { rate: stats.winRate })}</span>
              </>
            )}
          </p>
        )}

        {/* Cartes KPI enrichies */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {strategies.map((s) => {
            const plus = s.final - START_BANKROLL;
            const positive = plus >= 0;
            const growth = (s.final - START_BANKROLL) / START_BANKROLL;
            return (
              <div
                key={s.key}
                className="rounded-lg border border-border/50 bg-background/40 p-3 sm:p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    {s.name}
                  </span>
                </div>
                <div
                  className={`text-xl sm:text-2xl font-display font-bold ${s.tint}`}
                >
                  {eur0.format(s.final)}
                </div>
                <div className="text-xs sm:text-sm font-semibold mt-0.5">
                  <span
                    className={positive ? "text-emerald-500" : "text-red-500"}
                  >
                    {positive ? "+" : ""}
                    {eur0.format(plus)}
                  </span>
                  <span className="text-muted-foreground font-normal">
                    {" · "}
                    {pctFmt.format(growth)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Graphe en aire dégradée */}
        <div className="h-[220px] sm:h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillFlat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={FLAT_COLOR} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={FLAT_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillKelly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={KELLY_COLOR} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={KELLY_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.35}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => eurCompact.format(v as number)}
                width={56}
                domain={["auto", "auto"]}
              />
              <Tooltip
                formatter={(value: number | string, name: string) => [
                  eur2.format(Number(value)),
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--card-foreground))",
                  fontSize: "0.8rem",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <ReferenceLine
                y={START_BANKROLL}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{
                  value: eur0.format(START_BANKROLL),
                  position: "insideBottomRight",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="flat"
                name={t("backtest.strategyFlat")}
                stroke={FLAT_COLOR}
                strokeWidth={2.5}
                fill="url(#fillFlat)"
                dot={{ r: 2.5 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="kelly"
                name={t("backtest.strategyKelly")}
                stroke={KELLY_COLOR}
                strokeWidth={2.5}
                fill="url(#fillKelly)"
                dot={{ r: 2.5 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bouton de transparence */}
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                {t("backtest.hideBets")}
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                {t("backtest.seeAllBets")}
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Volet dépliable : couverture + navigateur pari-par-pari */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-6 animate-fade-in">
            {/* Couverture par mois */}
            {stats && (
              <div>
                <h3 className="text-sm font-display font-bold mb-2">
                  {t("backtest.coverageTitle")}
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("backtest.month")}</TableHead>
                        <TableHead className="text-right">
                          {t("backtest.betsTaken")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("backtest.matchesAnalyzed")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.monthlyBets.map((r) => {
                        const matches = matchCounts?.[r.month];
                        return (
                          <TableRow key={r.month}>
                            <TableCell className="whitespace-nowrap">
                              {formatMonth(r.month)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                              {r.n_bets}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {matchCounts === null
                                ? "…"
                                : matches != null
                                ? matches
                                : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-2">
                  {t("backtest.coverageNote")}
                </p>
              </div>
            )}

            {/* Navigateur pari-par-pari + simulateur de mise Kelly */}
            {betMonths.length > 0 && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <h3 className="text-sm font-display font-bold">
                    {t("backtest.allBetsTitle")}
                  </h3>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="bk-input"
                      className="text-xs text-muted-foreground whitespace-nowrap"
                    >
                      {t("backtest.yourBankroll")}
                    </label>
                    <div className="relative">
                      <Input
                        id="bk-input"
                        type="number"
                        min={0}
                        step={100}
                        value={bankroll}
                        onChange={(e) =>
                          setBankroll(Math.max(0, Number(e.target.value) || 0))
                        }
                        className="w-[104px] h-9 pr-6 bg-background border-border tabular-nums"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        €
                      </span>
                    </div>
                    <Select
                      value={effectiveMonth ?? undefined}
                      onValueChange={setSelectedMonth}
                    >
                      <SelectTrigger className="w-[130px] sm:w-[150px] bg-background border-border">
                        <SelectValue placeholder={t("backtest.selectMonth")} />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border z-50">
                        {betMonths.map((m) => (
                          <SelectItem key={m} value={m}>
                            {formatMonth(m)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="max-h-[420px] overflow-y-auto overflow-x-auto rounded-lg border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("backtest.date")}</TableHead>
                        <TableHead>{t("backtest.match")}</TableHead>
                        <TableHead>{t("backtest.betOn")}</TableHead>
                        <TableHead className="text-right">
                          {t("backtest.odds")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("backtest.stake")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("backtest.result")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("backtest.profit")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthBets.map((b, i) => (
                        <TableRow key={i}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatBetDate(b.date)}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate">
                            {b.match}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {b.bet_on}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {b.odds.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            <span className="font-semibold text-primary">
                              {eur2.format(b.userStake)}
                            </span>
                            <span className="text-muted-foreground/70 text-[11px]">
                              {" "}
                              ({(b.pct * 100).toFixed(1)}%)
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {b.won ? "✅" : "❌"}
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums font-medium ${
                              b.userProfit >= 0
                                ? "text-emerald-500"
                                : "text-red-500"
                            }`}
                          >
                            {b.userProfit >= 0 ? "+" : ""}
                            {eur2.format(b.userProfit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-2">
                  {t("backtest.kellyNote")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground/70 text-center mt-4">
          {t("backtest.disclaimer")}
        </p>
      </div>
    </section>
  );
};

export default BacktestPerformance;
