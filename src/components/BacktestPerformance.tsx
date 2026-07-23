import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Config                                                                     */
/* -------------------------------------------------------------------------- */

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/franc0510/streamlit-shine-sparkle/main/public/Documents";

const START_BANKROLL = 10000;

const FLAT_COLOR = "#3b82f6"; // bleu — Mise fixe (flat 1%)
const KELLY_COLOR = "#22c55e"; // vert — Kelly borné 1-2%

const EDGE_OPTIONS = [
  { value: "0", label: "Edge > 0 %" },
  { value: "5", label: "Edge ≥ 5 %" },
  { value: "10", label: "Edge ≥ 10 %" },
];

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eur2 = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

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

/* -------------------------------------------------------------------------- */
/*  Formatting helpers                                                         */
/* -------------------------------------------------------------------------- */

const MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

const formatMonth = (month: string): string => {
  const [y, m] = month.split("-");
  const idx = parseInt(m, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx > 11) return month;
  return `${MONTHS_FR[idx]} ${y}`;
};

const formatBetDate = (date: string): string => {
  // date attendue en YYYY-MM-DD (éventuellement avec heure)
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export const BacktestPerformance = () => {
  const [bankrollRows, setBankrollRows] = useState<BankrollRow[] | null>(null);
  const [betRows, setBetRows] = useState<BetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [edge, setEdge] = useState("5");

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

    const months = Array.from(
      new Set(forEdge.map((r) => r.month))
    ).sort((a, b) => a.localeCompare(b));

    const flatByMonth = new Map(flat.map((r) => [r.month, r.bankroll_eur]));
    const kellyByMonth = new Map(kelly.map((r) => [r.month, r.bankroll_eur]));

    const data: ChartPoint[] = [
      { month: "Départ", flat: START_BANKROLL, kelly: START_BANKROLL },
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
  }, [bankrollRows, edge]);

  /* --- derniers paris (edge sélectionné + flat, 10 plus récents) --- */
  const recentBets = useMemo(() => {
    return betRows
      .filter((b) => b.edge === edge && b.bet_type === "flat")
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [betRows, edge]);

  const bestFinal = Math.max(flatFinal, kellyFinal);

  /* --- rendu : rien tant que ça charge ou en cas d'échec --- */
  if (loading || failed || !bankrollRows || chartData.length <= 1) return null;

  return (
    <section className="mb-10 sm:mb-12 animate-fade-in">
      <div className="bg-gradient-card border border-border/50 rounded-xl p-5 sm:p-8">
        {/* En-tête */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-3">
            <span className="bg-gradient-gaming bg-clip-text text-transparent">
              10 000 € suivis depuis janvier 2026 → {eur.format(bestFinal)}
            </span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
            Backtest sur résultats réels 2026 (cotes historiques + vrais
            vainqueurs) : ce qu'une bankroll de 10 000 € serait devenue en
            suivant les paris value du modèle.
          </p>
        </div>

        {/* Sélecteur d'edge */}
        <div className="flex justify-center mb-6">
          <Tabs value={edge} onValueChange={setEdge}>
            <TabsList>
              {EDGE_OPTIONS.map((o) => (
                <TabsTrigger key={o.value} value={o.value}>
                  {o.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Cartes KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <KpiCard
            label="Mise fixe (flat 1%)"
            color={FLAT_COLOR}
            final={flatFinal}
          />
          <KpiCard
            label="Kelly borné 1-2%"
            color={KELLY_COLOR}
            final={kellyFinal}
          />
        </div>

        {/* Graphe */}
        <Card className="bg-background/40 border-border/50 mb-6">
          <CardContent className="pt-6">
            <div className="h-[300px] sm:h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(v) => eur.format(v as number)}
                    width={78}
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
                  <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
                  <ReferenceLine
                    y={START_BANKROLL}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    label={{
                      value: "10 000 €",
                      position: "insideBottomRight",
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="flat"
                    name="Mise fixe (flat 1%)"
                    stroke={FLAT_COLOR}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="kelly"
                    name="Kelly borné 1-2%"
                    stroke={KELLY_COLOR}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Table des derniers paris */}
        {recentBets.length > 0 && (
          <Card className="bg-background/40 border-border/50 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Derniers paris
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Pari</TableHead>
                      <TableHead className="text-right">Cote</TableHead>
                      <TableHead className="text-center">Résultat</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBets.map((b, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatBetDate(b.date)}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {b.match}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {b.bet_on}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {b.odds.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {b.won ? "✅" : "❌"}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums font-medium ${
                            b.profit_eur >= 0
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {b.profit_eur >= 0 ? "+" : ""}
                          {eur2.format(b.profit_eur)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground/70 text-center">
          Le Kelly borné suppose une mise réellement plaçable. Performances
          passées ≠ garantie future.
        </p>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  KPI Card                                                                   */
/* -------------------------------------------------------------------------- */

const KpiCard = ({
  label,
  color,
  final,
}: {
  label: string;
  color: string;
  final: number;
}) => {
  const plusValue = final - START_BANKROLL;
  const positive = plusValue >= 0;
  return (
    <Card className="bg-background/40 border-border/50">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-display font-bold">
          {eur.format(final)}
        </div>
        <div
          className={`text-sm font-semibold mt-1 ${
            positive ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {positive ? "+" : ""}
          {eur.format(plusValue)}
          <span className="text-muted-foreground font-normal">
            {" "}
            de plus-value
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BacktestPerformance;
