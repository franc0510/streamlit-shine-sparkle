import React, { useMemo } from "react";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from "recharts";
import { getPlayerImage, type PlayerStats, type TimeWindow, type ScaleMode } from "@/lib/parquetParser";

type Props = {
  player: PlayerStats | null | undefined;
  title?: string;
  accentColor?: string;
  scaleMode?: ScaleMode; // none | minmax | zscore
  timeWindow?: TimeWindow; // last_10 | last_20 | last_365d
  height?: number;
};

function normalizeVector(xs: number[], mode: ScaleMode) {
  if (!xs.length || mode === "none") return xs.slice();
  if (mode === "minmax") {
    const mn = Math.min(...xs),
      mx = Math.max(...xs);
    if (mx === mn) return xs.map(() => 0);
    return xs.map((x) => (x - mn) / (mx - mn));
  }
  // z-score
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const var_ = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length;
  const sd = Math.sqrt(var_) || 1;
  return xs.map((x) => (x - mean) / sd);
}

/** Axe → label humain */
const LABELS: Record<string, string> = {
  kda_last_10: "KDA",
  kda_last_20: "KDA",

  earned_gpm_avg_last_10: "GPM",
  earned_gpm_avg_last_20: "GPM",
  earned_gpm_avg_last_365d: "GPM",

  cspm_avg_last_10: "CSPM",
  cspm_avg_last_20: "CSPM",
  cspm_avg_last_365d: "CSPM",

  vspm_avg_last_10: "VSPM",
  vspm_avg_last_20: "VSPM",
  vspm_avg_last_365d: "VSPM",

  dpm_avg_last_10: "DPM",
  dpm_avg_last_20: "DPM",
  dpm_avg_last_365d: "DPM",
};

/** Axes stricts par fenêtre (5 axes pour 10/20, 4 axes pour 365d sans KDA) */
const AXES_BY_WINDOW: Record<TimeWindow, string[]> = {
  last_10: ["kda_last_10", "earned_gpm_avg_last_10", "cspm_avg_last_10", "vspm_avg_last_10", "dpm_avg_last_10"],
  last_20: ["kda_last_20", "earned_gpm_avg_last_20", "cspm_avg_last_20", "vspm_avg_last_20", "dpm_avg_last_20"],
  last_365d: ["earned_gpm_avg_last_365d", "cspm_avg_last_365d", "vspm_avg_last_365d", "dpm_avg_last_365d"],
};

const PlayerRadarChart: React.FC<Props> = ({
  player,
  title,
  accentColor = "#4DA3FF",
  scaleMode = "none",
  timeWindow = "last_10",
  height = 280,
}) => {
  const playerName =
    (player?.player && String(player.player)) || (player?.player_name && String(player.player_name)) || "Unknown";
  const imgSrc = getPlayerImage(playerName);

  const axes = AXES_BY_WINDOW[timeWindow];

  const rawPoints = useMemo(() => {
    if (!player) return [];
    return axes.map((k) => ({ key: k, value: Number((player as any)[k]) })).filter((x) => Number.isFinite(x.value));
  }, [player, axes]);

  const chartData = useMemo(() => {
    const xs = rawPoints.map((p) => p.value);
    const normed = normalizeVector(xs, scaleMode);
    return rawPoints.map((p, i) => ({
      metric: LABELS[p.key],
      value: normed[i],
      raw: p.value,
    }));
  }, [rawPoints, scaleMode]);

  if (!player || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/90 font-bold mb-1">{title || playerName}</div>
        <div className="text-white/70 text-sm">Données insuffisantes</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 animate-fade-in hover-scale">
      {/* header */}
      <div className="flex items-center gap-3 mb-2">
        <img
          src={imgSrc}
          alt={playerName}
          className="h-10 w-10 rounded-full object-cover border border-white/20"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")}
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
            <PolarGrid stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#ffffff", fontSize: 12 }} />
            <PolarRadiusAxis tick={{ fill: "#ffffff", fontSize: 10 }} axisLine={false} tickLine={false} domain={scaleMode === "minmax" ? [0, 1] : undefined} tickCount={5} />
            <Radar
              name={playerName}
              dataKey="value"
              stroke={accentColor}
              strokeWidth={2}
              fill={accentColor}
              fillOpacity={0.5}
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
                const num = Number(v as any);
                const rawNum = Number(raw as any);
                const valueText = scaleMode === "minmax"
                  ? `${Number.isFinite(num) ? (num * 100).toFixed(0) : "-"}%`
                  : `${Number.isFinite(num) ? num.toFixed(2) : "-"}`;
                return [
                  `${valueText} (raw: ${Number.isFinite(rawNum) ? rawNum.toFixed(2) : "-"})`,
                  (ctx?.payload as any)?.metric ?? "",
                ];
              }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-white/60 text-[11px] mt-2 text-center">
        Normalisation: <span className="text-white/80 font-semibold">{scaleMode}</span>
      </div>
    </div>
  );
};

export default PlayerRadarChart;
