import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  parsePlayerDataParquet,
  type TeamStats,
  type PlayerStats,
  type ScaleMode,
  type TimeWindow,
} from "@/lib/parquetParser";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

/* ------------- URL helpers ------------- */
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}
const titleCase = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/_/g, " ");

/* ------------- KPI par fenêtre ------------- */
const KPI_BY_WINDOW: Record<TimeWindow, string[]> = {
  last_10: [
    "kda_last_10",
    "earned_gpm_avg_last_10",
    "dpm_avg_last_365d",
    "wcpm_avg_last_365d",
    "vspm_avg_last_365d",
    "earned_gpm_avg_last_365d",
  ],
  last_20: ["kda_last_20", "dpm_avg_last_365d", "wcpm_avg_last_365d", "vspm_avg_last_365d", "earned_gpm_avg_last_365d"],
  last_365d: [
    "kda_last_10",
    "dpm_avg_last_365d",
    "wcpm_avg_last_365d",
    "vspm_avg_last_365d",
    "earned_gpm_avg_last_365d",
  ],
};

function resolveAxes(players: PlayerStats[], win: TimeWindow): string[] {
  const want = KPI_BY_WINDOW[win];
  const has = (k: string) => players.some((p) => typeof (p as any)[k] === "number");
  const primary = want.filter(has);
  if (primary.length >= 3) return primary.slice(0, 6);
  const fallback = KPI_BY_WINDOW["last_365d"].filter(has);
  return [...new Set([...primary, ...fallback])].slice(0, 6);
}

/* ------------- Normalisation ------------- */
type ScaleChoice = ScaleMode; // "none" | "minmax" | "zscore"

function normalize(rows: number[][], mode: ScaleChoice): number[][] {
  if (mode === "none") return rows;
  const n = rows.length;
  const m = rows[0]?.length ?? 0;
  if (!n || !m) return rows;
  const cols = Array.from({ length: m }, (_, j) => rows.map((r) => r[j]));
  const nc = cols.map((c) => {
    const v = c.filter((x) => Number.isFinite(x));
    if (!v.length) return c.map(() => 0);
    if (mode === "minmax") {
      const min = Math.min(...v);
      const max = Math.max(...v);
      const range = max - min || 1;
      return c.map((x) => (Number.isFinite(x) ? (x - min) / range : 0));
    }
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(v.length - 1, 1)) || 1;
    return c.map((x) => (Number.isFinite(x) ? (x - mean) / sd : 0));
  });
  return rows.map((_, i) => nc.map((c) => c[i]));
}

/* ------------- Recharts helpers ------------- */
function toRadarSeries(label: string, axes: string[], values: number[]) {
  return axes.map((k, i) => ({
    metric: titleCase(k.replace(/_avg_|_last_/g, " ").replace(/365d/g, "365d")),
    [label]: Number.isFinite(values[i]) ? values[i] : 0,
  }));
}

function TeamRadar({
  team,
  axes,
  scale,
  color,
}: {
  team: TeamStats;
  axes: string[];
  scale: ScaleChoice;
  color: "A" | "B";
}) {
  const rows = team.players.map((p) => axes.map((k) => Number(p[k] as number) || 0));
  const mean = axes.map((_, j) => {
    const vals = rows.map((r) => r[j]).filter((x) => Number.isFinite(x));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });
  const norm = normalize([mean], scale)[0];
  const data = toRadarSeries(team.team, axes, norm);
  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "white", fontSize: 12 }} />
          <PolarRadiusAxis tick={{ fill: "white", fontSize: 10 }} stroke="#ffffff55" />
          <Radar
            name={team.team}
            dataKey={team.team}
            fill={color === "A" ? "#50B4FF55" : "#00D2AA55"}
            stroke={color === "A" ? "#50B4FF" : "#00D2AA"}
            fillOpacity={0.5}
          />
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlayerRadar({
  player,
  axes,
  scale,
  color,
}: {
  player: PlayerStats;
  axes: string[];
  scale: ScaleChoice;
  color: "A" | "B";
}) {
  const vec = axes.map((k) => Number(player[k] as number) || 0);
  const norm = normalize([vec], scale)[0];
  const data = toRadarSeries(player.player, axes, norm);
  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "white", fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fill: "white", fontSize: 10 }} stroke="#ffffff55" />
          <Radar
            name={player.player}
            dataKey={player.player}
            fill={color === "A" ? "#50B4FF99" : "#00D2AA99"}
            stroke={color === "A" ? "#50B4FF" : "#00D2AA"}
            fillOpacity={0.5}
          />
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
      <div className="text-center mt-1 text-white/90 text-sm">
        {player.player} {player.position ? `• ${player.position}` : ""}
      </div>
    </div>
  );
}

/* ------------- Page ------------- */

export default function MatchDetails() {
  const q = useQuery();
  const team1 = q.get("team1") || "";
  const team2 = q.get("team2") || "";
  const league = q.get("league") || "";
  const bo = q.get("bo") || "BO3";
  const when = q.get("date") || "";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scale, setScale] = useState<ScaleChoice>("none");
  const [win, setWin] = useState<TimeWindow>("last_10");
  const [A, setA] = useState<TeamStats | null>(null);
  const [B, setB] = useState<TeamStats | null>(null);

  // charge les équipes
  useEffect(() => {
    let stop = false;
    async function run() {
      setLoading(true);
      setErr(null);
      setA(null);
      setB(null);
      try {
        const res = await parsePlayerDataParquet(team1, team2, scale);
        if (!stop && res) {
          setA(res[0]);
          setB(res[1]);
        }
      } catch (e: any) {
        if (!stop) setErr(String(e?.message || e));
      } finally {
        if (!stop) setLoading(false);
      }
    }
    run();
    return () => {
      stop = true;
    };
  }, [team1, team2, scale]);

  const axes = useMemo(() => {
    const players = [...(A?.players || []), ...(B?.players || [])];
    return resolveAxes(players, win);
  }, [A, B, win]);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-4">
      <div className="text-center mb-4">
        <div className="text-2xl md:text-3xl font-black text-white">
          {team1} <span className="text-white/70">vs</span> {team2}
        </div>
        <div className="text-white/70 font-semibold">
          {league ? `${league} • ` : ""}
          {bo}
          {when ? ` • ${when}` : ""}
        </div>
      </div>

      {/* contrôles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="font-bold text-white mb-2">Fenêtre temporelle</div>
          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-3 py-1.5 rounded-md border ${win === "last_10" ? "bg-yellow-500 text-black border-yellow-400" : "border-white/30 text-white"}`}
              onClick={() => setWin("last_10")}
            >
              10 derniers
            </button>
            <button
              className={`px-3 py-1.5 rounded-md border ${win === "last_20" ? "bg-yellow-500 text-black border-yellow-400" : "border-white/30 text-white"}`}
              onClick={() => setWin("last_20")}
            >
              20 derniers
            </button>
            <button
              className={`px-3 py-1.5 rounded-md border ${win === "last_365d" ? "bg-yellow-500 text-black border-yellow-400" : "border-white/30 text-white"}`}
              onClick={() => setWin("last_365d")}
            >
              365 jours
            </button>
          </div>
          <div className="text-xs text-white/60 mt-2">Fallback automatique si une métrique manque.</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="font-bold text-white mb-2">Normalisation</div>
          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-3 py-1.5 rounded-md border ${scale === "none" ? "bg-yellow-500 text-black border-yellow-400" : "border-white/30 text-white"}`}
              onClick={() => setScale("none")}
            >
              Aucune
            </button>
            <button
              className={`px-3 py-1.5 rounded-md border ${scale === "minmax" ? "bg-yellow-500 text-black border-yellow-400" : "border-white/30 text-white"}`}
              onClick={() => setScale("minmax")}
            >
              Min-Max
            </button>
            <button
              className={`px-3 py-1.5 rounded-md border ${scale === "zscore" ? "bg-yellow-500 text-black border-yellow-400" : "border-white/30 text-white"}`}
              onClick={() => setScale("zscore")}
            >
              Z-score
            </button>
          </div>
          <div className="text-xs text-white/60 mt-2">Appliquée par métrique sur le radar.</div>
        </div>
      </div>

      {/* états */}
      {loading && <div className="text-white/80">Chargement…</div>}
      {err && <div className="text-red-300 bg-red-900/30 border border-red-700/40 rounded-md p-3 mb-4">{err}</div>}

      {/* debug si pas de joueurs */}
      {!loading && !err && (A?.players.length ?? 0) === 0 && (
        <div className="text-white/70 mb-3">
          Aucune donnée trouvée pour <b>{team1}</b>. Nom résolu: <b>{A?.resolvedFrom || "?"}</b>
        </div>
      )}
      {!loading && !err && (B?.players.length ?? 0) === 0 && (
        <div className="text-white/70 mb-3">
          Aucune donnée trouvée pour <b>{team2}</b>. Nom résolu: <b>{B?.resolvedFrom || "?"}</b>
        </div>
      )}

      {/* contenu */}
      {!loading && !err && A && B && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="font-extrabold text-white text-lg mb-2">{A.team}</div>
              {A.players.length ? (
                <>
                  <div className="text-white/80 text-sm mb-2">Joueurs: {A.players.map((p) => p.player).join(", ")}</div>
                  <TeamRadar team={A} axes={axes} scale={scale} color="A" />
                </>
              ) : (
                <div className="text-white/60">Données insuffisantes.</div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="font-extrabold text-white text-lg mb-2">{B.team}</div>
              {B.players.length ? (
                <>
                  <div className="text-white/80 text-sm mb-2">Joueurs: {B.players.map((p) => p.player).join(", ")}</div>
                  <TeamRadar team={B} axes={axes} scale={scale} color="B" />
                </>
              ) : (
                <div className="text-white/60">Données insuffisantes.</div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-extrabold text-white mb-3">Comparaison joueurs (5v5)</h3>
            {A.players.length && B.players.length ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {A.players.map((p, i) => (
                  <PlayerRadar key={`A-${p.player}-${i}`} player={p} axes={axes} scale={scale} color="A" />
                ))}
                {B.players.map((p, i) => (
                  <PlayerRadar key={`B-${p.player}-${i}`} player={p} axes={axes} scale={scale} color="B" />
                ))}
              </div>
            ) : (
              <div className="text-white/70">Joueurs manquants pour construire les radars.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
