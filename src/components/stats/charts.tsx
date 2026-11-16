import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Line, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { pct } from "@/lib/stats";
import { useTr } from "@/hooks/useTr";

export const C = {
  pos: "hsl(152 60% 52%)",
  neg: "hsl(0 72% 62%)",
  primary: "hsl(255 92% 70%)",
  accent: "hsl(188 92% 52%)",
  grid: "hsl(230 25% 22%)",
  axis: "hsl(225 14% 62%)",
};

const tip = {
  contentStyle: { background: "hsl(232 32% 8%)", border: "1px solid hsl(230 25% 20%)", borderRadius: 10, fontSize: 12 },
  labelStyle: { color: "hsl(220 25% 95%)", fontWeight: 600 },
  itemStyle: { color: "hsl(220 25% 95%)" },
  cursor: { fill: "hsl(232 24% 14% / 0.6)" },
} as const;

/** Anneau gagnés / perdus avec le taux au centre. */
export const WinDonut = ({ won, lost, size = 180 }: { won: number; lost: number; size?: number }) => {
  const { tr } = useTr();
  const total = won + lost;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} role="img" aria-label={`${won} ${tr("gagnés", "won")}, ${lost} ${tr("perdus", "lost")}`}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={[{ n: won }, { n: lost }]} dataKey="n" innerRadius="68%" outerRadius="100%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
            <Cell fill={C.pos} /><Cell fill={C.neg} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-3xl font-bold tabular-nums">{pct(won / total, 0)}</div>
          <div className="text-[11px] text-muted-foreground">{won} / {total}</div>
        </div>
      </div>
    </div>
  );
};

/** ROI par mois (barres verticales vertes / rouges). */
export const MonthRoi = ({ data, height = 220 }: { data: { month: string; roi: number; n: number }[]; height?: number }) => (
  <div style={{ height }} role="img" aria-label="ROI par mois">
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 22, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={C.grid} />
        <XAxis dataKey="month" tickFormatter={(m) => m.slice(5)} stroke={C.axis} fontSize={12} tickLine={false} />
        <YAxis tickCount={5} tickFormatter={(v) => `${Math.round(v * 100)}%`} stroke={C.axis} fontSize={12} tickLine={false} axisLine={false} width={44} />
        <ReferenceLine y={0} stroke={C.axis} />
        <Tooltip {...tip} formatter={(v: number) => [pct(v, 1, true), "ROI"]} labelFormatter={(m) => String(m)} />
        <Bar dataKey="roi" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.month} fill={d.roi >= 0 ? C.pos : C.neg} />)}
          <LabelList dataKey="roi" position="top" formatter={(v: number) => pct(v, 0, true)} fill="hsl(220 25% 95%)" fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/** ROI par ligue (barres horizontales). */
export const LeagueRoi = ({ data }: { data: { league: string; roi: number; n: number }[] }) => (
  <div style={{ height: Math.max(180, data.length * 34 + 20) }} role="img" aria-label="ROI par ligue">
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
        <CartesianGrid horizontal={false} stroke={C.grid} />
        <XAxis type="number" domain={[(m: number) => Math.min(m, 0) - 0.3, (m: number) => Math.max(m, 0) + 0.15]} tickFormatter={(v) => `${Math.round(v * 100)}%`} stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="league" stroke={C.axis} fontSize={12} tickLine={false} axisLine={false} width={92} />
        <ReferenceLine x={0} stroke={C.axis} />
        <Tooltip {...tip} formatter={(v: number, _n, p) => [`${pct(v, 0, true)} · ${p.payload.n} paris`, "ROI"]} />
        <Bar dataKey="roi" radius={4} barSize={16} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.league} fill={d.roi >= 0 ? C.pos : C.neg} />)}
          <LabelList dataKey="roi" position="right" formatter={(v: number) => pct(v, 0, true)} fill="hsl(220 25% 95%)" fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/** Prix payé (proba implicite) vs réussite réelle, par tranche de prix. */
export const PriceVsWin = ({ buckets, height = 260 }: { buckets: { range: string; n: number; avg_price: number; win_rate: number }[]; height?: number }) => {
  const { tr } = useTr();
  return (
    <div style={{ height }} role="img" aria-label={tr("Prix payé contre réussite réelle", "Price paid vs actual win rate")}>
      <ResponsiveContainer>
        <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={3}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="range" stroke={C.axis} fontSize={11} tickLine={false} />
          <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} stroke={C.axis} fontSize={12} tickLine={false} axisLine={false} width={44} domain={[0, 1]} />
          <Tooltip {...tip} formatter={(v: number, k: string) => [pct(v, 0), k === "avg_price" ? tr("Prix payé", "Price paid") : tr("Réussite réelle", "Actual win rate")]} labelFormatter={(r, p) => `${r} · ${p?.[0]?.payload.n ?? ""} ${tr("paris", "bets")}`} />
          <Bar dataKey="avg_price" fill={C.primary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="win_rate" fill={C.accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const Legend2 = ({ a, b }: { a: string; b: string }) => (
  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
    <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: C.primary }} />{a}</span>
    <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: C.accent }} />{b}</span>
  </div>
);

/** Courbe de fiabilité : proba annoncée (x) vs fréquence observée (y), diagonale = parfait. */
export const Reliability = ({ bins, height = 260 }: { bins: { p_mean: number; win_rate: number; n: number }[]; height?: number }) => {
  const { tr } = useTr();
  const data = bins.map((b) => ({ x: b.p_mean, y: b.win_rate, ideal: b.p_mean, n: b.n }));
  return (
    <div style={{ height }} role="img" aria-label={tr("Probabilité annoncée contre fréquence observée", "Predicted vs observed frequency")}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
          <CartesianGrid stroke={C.grid} />
          <XAxis dataKey="x" type="number" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} stroke={C.axis} fontSize={11} tickLine={false} label={{ value: tr("Probabilité annoncée", "Predicted probability"), position: "insideBottom", offset: -10, fill: C.axis, fontSize: 11 }} />
          <YAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} width={44} />
          <Tooltip {...tip} formatter={(v: number, k: string) => [pct(v, 1), k === "y" ? tr("Observé", "Observed") : tr("Parfait", "Perfect")]} labelFormatter={(x) => `${tr("Annoncé", "Predicted")} ${pct(Number(x), 0)}`} />
          <Line dataKey="ideal" stroke={C.axis} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
          <Line dataKey="y" stroke={C.accent} strokeWidth={2.5} dot={{ r: 4, fill: C.accent }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Écart de log-loss par rapport au marché : plus la barre va vers la gauche, meilleur est le pronostic. */
export const VsMarket = ({ rows }: { rows: { label: string; delta: number; highlight?: boolean }[] }) => {
  const { tr } = useTr();
  return (
    <div style={{ height: rows.length * 54 + 30 }} role="img" aria-label={tr("Écart de log-loss avec le marché", "Log-loss gap vs market")}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 56, bottom: 18, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={C.grid} />
          <XAxis type="number" domain={["dataMin - 0.006", 0.002]} tickFormatter={(v) => v.toFixed(3)} stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} label={{ value: tr("← meilleur que le marché", "← better than market"), position: "insideBottom", offset: -12, fill: C.axis, fontSize: 11 }} />
          <YAxis type="category" dataKey="label" stroke={C.axis} fontSize={12} tickLine={false} axisLine={false} width={150} />
          <ReferenceLine x={0} stroke={C.axis} />
          <Bar dataKey="delta" barSize={22} radius={4} isAnimationActive={false}>
            {rows.map((r) => <Cell key={r.label} fill={r.highlight ? C.accent : C.primary} />)}
            <LabelList dataKey="delta" position="right" formatter={(v: number) => (v === 0 ? "réf." : v.toFixed(4))} fill="hsl(220 25% 95%)" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Barres horizontales simples (compteurs). */
export const CountBars = ({ rows }: { rows: { label: string; n: number; highlight?: boolean }[] }) => (
  <div style={{ height: rows.length * 40 + 10 }}>
    <ResponsiveContainer>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" stroke={C.axis} fontSize={12} tickLine={false} axisLine={false} width={190} />
        <Bar dataKey="n" barSize={16} radius={4} isAnimationActive={false}>
          {rows.map((r) => <Cell key={r.label} fill={r.highlight ? C.pos : C.primary} />)}
          <LabelList dataKey="n" position="right" fill="hsl(220 25% 95%)" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);
