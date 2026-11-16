import { ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { DailyPoint, daysSince, pct, shortDate, usd } from "@/lib/stats";
import { useTr } from "@/hooks/useTr";

export const Kpi = ({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "pos" | "neg" }) => (
  <div className="rounded-xl border border-border/60 bg-card/60 p-4 sm:p-5">
    <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className={`mt-1 font-display text-3xl sm:text-4xl font-bold tabular-nums ${tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-red-400" : "text-foreground"}`}>
      {value}
    </div>
    {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
  </div>
);

export type Stage = "live" | "dev" | "test" | "soon";
export const StagePill = ({ stage }: { stage: Stage }) => {
  const { tr } = useTr();
  const map: Record<Stage, { label: string; cls: string }> = {
    live: { label: tr("En production · argent réel", "Live · real money"), cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
    dev: { label: tr("En développement", "In development"), cls: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
    test: { label: tr("En test · paper trading", "Testing · paper trading"), cls: "bg-sky-500/15 text-sky-300 border-sky-500/40" },
    soon: { label: tr("Prévu", "Planned"), cls: "bg-muted text-muted-foreground border-border" },
  };
  const s = map[stage];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
};

/** Bandeau de fraîcheur : dit clairement jusqu'à quand les données vont. */
export const Freshness = ({ asof, generated, extra }: { asof: string; generated?: string; extra?: ReactNode }) => {
  const { tr, lng } = useTr();
  const age = daysSince(asof);
  const stale = age > 3;
  const Icon = stale ? AlertTriangle : CheckCircle2;
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${stale ? "border-amber-500/40 bg-amber-500/10 text-amber-100" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <span className="font-semibold">
          {tr("Données du wallet arrêtées au", "Wallet data up to")}{" "}
          {new Date(asof).toLocaleDateString(lng, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
        </span>
        {stale && <span> · {tr(`il y a ${Math.floor(age)} jours`, `${Math.floor(age)} days ago`)}</span>}
        {generated && (
          <span className="opacity-80"> · {tr("page régénérée le", "page rebuilt")} {new Date(generated).toLocaleString(lng, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</span>
        )}
        {extra && <div className="mt-1 opacity-90">{extra}</div>}
      </div>
    </div>
  );
};

export const Section = ({ id, title, kicker, children }: { id?: string; title: string; kicker?: string; children: ReactNode }) => (
  <section id={id} className="scroll-mt-24 py-10 sm:py-14">
    {kicker && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker}</div>}
    <h2 className="mb-6 font-display text-3xl sm:text-4xl font-bold">{title}</h2>
    {children}
  </section>
);

export const Loading = () => (
  <div className="flex items-center gap-2 py-10 text-muted-foreground"><Clock className="h-4 w-4 animate-pulse" /> …</div>
);

const GREEN = "hsl(152 60% 52%)";
const RED = "hsl(0 72% 62%)";

export const PnlChart = ({ daily, height = 320 }: { daily: DailyPoint[]; height?: number }) => {
  const { tr, lng } = useTr();
  // la série ne démarre pas avant le premier jour où un pari est réglé : on garde tout pour que l'axe soit honnête
  const last = daily[daily.length - 1]?.cum_pnl ?? 0;
  const color = last >= 0 ? GREEN : RED;
  const ticks = daily.filter((_, i) => i % Math.ceil(daily.length / 7) === 0).map((d) => d.date);
  return (
    <div role="img" aria-label={tr("Courbe du résultat cumulé en dollars depuis le 13 août 2026", "Cumulative profit and loss in dollars since 13 August 2026")} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={daily} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(210 15% 55% / 0.15)" vertical={false} />
          <XAxis dataKey="date" ticks={ticks} tickFormatter={(d) => shortDate(d, lng)} stroke="hsl(210 15% 55%)" fontSize={12} tickLine={false} />
          <YAxis tickFormatter={(v) => `$${v}`} stroke="hsl(210 15% 55%)" fontSize={12} tickLine={false} axisLine={false} width={52} />
          <ReferenceLine y={0} stroke="hsl(210 15% 55%)" strokeDasharray="4 4" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as DailyPoint;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <div className="mb-1 font-semibold">{shortDate(p.date, lng)}</div>
                  <div>{tr("Cumulé", "Cumulative")} : <b className={p.cum_pnl >= 0 ? "text-emerald-400" : "text-red-400"}>{usd(p.cum_pnl, true)}</b></div>
                  <div>{tr("Ce jour", "That day")} : {usd(p.pnl, true)} ({p.n} {tr("paris", "bets")})</div>
                  <div>ROI {tr("cumulé", "to date")} : {p.roi == null ? "—" : pct(p.roi, 1, true)}</div>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="cum_pnl" stroke={color} strokeWidth={2.5} fill="url(#pnlFill)" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
