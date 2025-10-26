import React, { useMemo } from "react";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from "recharts";
import { getPlayerImage, type PlayerStats } from "@/lib/parquetParser";

export type TimeWindow = "last_10" | "last_20" | "last_365d";
export type ScaleMode = "none" | "minmax" | "zscore";

type Props = {
  player: PlayerStats | null | undefined;
  title?: string;
  accentColor?: string; // couleur principale du radar
  scaleMode?: ScaleMode; // none | minmax | zscore
  timeWindow?: TimeWindow; // last_10 | last_20 | last_365d
  height?: number;
};

/* ----------------------------- helpers ----------------------------- */

function num(...vals: Array<number | string | null | undefined>): number {
  for (const v of vals) {
    const n = Number(v as any);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

// Normalise un vecteur (tableau de numbers) et retourne [normed, extra]
// - minmax: [0,1]
// - zscore: moyenne 0, écart-type 1 (si std=0 → tout 0)
// - none  : identique
function normalizeVector(
  xs: number[],
  mode: ScaleMode,
): { values: number[]; extra?: { min?: number; max?: number; mean?: number; std?: number } } {
  if (!xs.length) return { values: [] };

  if (mode === "minmax") {
    const mn = Math.min(...xs);
    const mx = Math.max(...xs);
    if (mx === mn) return { values: xs.map(() => 0), extra: { min: mn, max: mx } };
    const vals = xs.map((x) => (x - mn) / (mx - mn));
    return { values: vals, extra: { min: mn, max: mx } };
  }

  if (mode === "zscore") {
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const var_ = xs.reduce((s, x) => s + (x - mean) * (x - mean), 0) / xs.length;
    const std = Math.sqrt(var_);
    if (std === 0) return { values: xs.map(() => 0), extra: { mean, std } };
    const vals = xs.map((x) => (x - mean) / std);
    return { values: vals, extra: { mean, std } };
  }

  return { values: xs.slice() };
}

function chooseKDA(window_: TimeWindow, p: PlayerStats): number {
  if (window_ === "last_10") {
    return num(p.kda_last_10, p.kda_last_20, p.kda_last_365d);
  }
  if (window_ === "last_20") {
    return num(p.kda_last_20, p.kda_last_10, p.kda_last_365d);
  }
  // 365d
  return num(p.kda_last_365d, p.kda_last_20, p.kda_last_10);
}

function chooseEGPM(window_: TimeWindow, p: PlayerStats): number {
  if (window_ === "last_10") {
    return num(p.earned_gpm_avg_last_10, p.earned_gpm_avg_last_365d);
  }
  if (window_ === "last_20") {
    // pas de colonne last_20 → on downshift vers 10 puis 365
    return num(p.earned_gpm_avg_last_10, p.earned_gpm_avg_last_365d);
  }
  // 365d
  return num(p.earned_gpm_avg_last_365d, p.earned_gpm_avg_last_10);
}

function safeTooltipVal(v: unknown): string {
  const n = Number(v as any);
  return Number.isFinite(n) ? n.toFixed(2) : "-";
}

/* --------------------------- composant ---------------------------- */

const PlayerRadarChart: React.FC<Props> = ({
  player,
  title,
  accentColor = "#4DA3FF",
  scaleMode = "none",
  timeWindow = "last_10",
  height = 280,
}) => {
  // garde-fous
  const hasData = Boolean(
    player &&
      (player.player || player.player_name) &&
      (player.kda_last_10 ||
        player.kda_last_20 ||
        player.earned_gpm_avg_last_10 ||
        player.earned_gpm_avg_last_365d ||
        player.dpm_avg_last_365d ||
        player.wcpm_avg_last_365d ||
        player.vspm_avg_last_365d),
  );

  const playerName =
    (player?.player && String(player.player)) || (player?.player_name && String(player.player_name)) || "Unknown";
  const imgSrc = getPlayerImage(playerName);

  // 1) On construit les 6 KPIs (avec fallback selon la fenêtre)
  const rawPoints = useMemo(() => {
    if (!player) return [];

    const kda = chooseKDA(timeWindow, player);
    const egpm = chooseEGPM(timeWindow, player);
    const dpm = num(player.dpm_avg_last_365d);
    const wcpm = num(player.wcpm_avg_last_365d);
    const vspm = num(player.vspm_avg_last_365d);

    const pts = [
      { key: "KDA", value: kda, hint: timeWindow === "last_365d" ? "365d" : timeWindow.replace("last_", "") },
      { key: "EGPM", value: egpm, hint: timeWindow === "last_365d" ? "365d" : timeWindow.replace("last_", "") },
      { key: "DPM", value: dpm, hint: "365d" },
      { key: "WCPM", value: wcpm, hint: "365d" },
      { key: "VSPM", value: vspm, hint: "365d" },
    ];

    // retire ceux qui sont tous à 0 (très rare) → on garde le graphe lisible
    return pts.filter((p) => Number.isFinite(p.value));
  }, [player, timeWindow]);

  // 2) Normalisation par radar
  const chartData = useMemo(() => {
    if (!rawPoints.length) return [];

    const xs = rawPoints.map((p) => Number(p.value) || 0);
    const normed = normalizeVector(xs, scaleMode);

    return rawPoints.map((p, i) => ({
      metric: `${p.key}${p.hint ? ` (${p.hint})` : ""}`,
      value: normed.values[i],
      raw: p.value,
    }));
  }, [rawPoints, scaleMode]);

  if (!hasData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/90 font-bold mb-1">{title || playerName}</div>
        <div className="text-white/70 text-sm">Données insuffisantes</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      {/* header */}
      <div className="flex items-center gap-3 mb-2">
        {/* avatar */}
        <img
          src={imgSrc}
          alt={playerName}
          className="h-10 w-10 rounded-full object-cover border border-white/20"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
        <div className="min-w-0">
          <div className="text-white font-extrabold leading-tight truncate">{title || playerName}</div>
          <div className="text-white/70 text-xs">{(player?.position || "").toString()}</div>
        </div>
      </div>

      {/* chart */}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RadarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
            <PolarGrid stroke="rgba(255,255,255,0.2)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#ffffff", fontSize: 12 }} />
            <PolarRadiusAxis tick={{ fill: "#ffffff", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Radar
              name={playerName}
              dataKey="value"
              stroke={accentColor}
              fill={accentColor}
              fillOpacity={0.35}
              isAnimationActive={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(30,30,30,0.9)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
              }}
              formatter={(v, _n, ctx) => {
                const raw = (ctx?.payload && (ctx.payload as any).raw) ?? v;
                return [`${safeTooltipVal(v)} (raw: ${safeTooltipVal(raw)})`, (ctx?.payload as any)?.metric ?? ""];
              }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* footer scale */}
      <div className="text-white/60 text-[11px] mt-2 text-center">
        Normalisation: <span className="text-white/80 font-semibold">{scaleMode}</span>
      </div>
    </div>
  );
};

export default PlayerRadarChart;
