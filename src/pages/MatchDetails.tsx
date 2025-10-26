import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
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

import {
  parsePlayerDataParquet,
  type TeamStats,
  type PlayerStats,
  type ScaleMode,
  type TimeWindow,
} from "@/lib/parquetParser";
import { parseScheduleCSV, getTeamLogo, type Match } from "@/lib/csvParser";

/* ========================== Helpers URL / UI ========================== */

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function titleCase(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/_/g, " ");
}

// Same slugification as Index.tsx to match URLs
function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

/* ========================== KPIs & Fenêtres ========================== */
/** KPI “canoniques” disponibles dans DF_filtered.parquet */
const KPI_BY_WINDOW: Record<TimeWindow, string[]> = {
  last_10: [
    "kda_last_10",
    "earned_gpm_avg_last_10",
    // on affiche aussi des KPIs 365 si 10 indispo
    "dpm_avg_last_365d",
    "wcpm_avg_last_365d",
    "vspm_avg_last_365d",
    "earned_gpm_avg_last_365d",
  ],
  last_20: [
    // si tu as des colonnes *_last_20, ajoute-les ici. On garde 365 en fallback :
    "kda_last_20",
    "dpm_avg_last_365d",
    "wcpm_avg_last_365d",
    "vspm_avg_last_365d",
    "earned_gpm_avg_last_365d",
  ],
  last_365d: [
    "kda_last_10", // s’il n’y a pas kda_365, on garde le 10 (mieux que rien)
    "dpm_avg_last_365d",
    "wcpm_avg_last_365d",
    "vspm_avg_last_365d",
    "earned_gpm_avg_last_365d",
  ],
};

/** Renvoie la liste finale de KPIs réellement présents dans les joueurs */
function resolveAvailableKpis(players: PlayerStats[], win: TimeWindow): string[] {
  const wanted = KPI_BY_WINDOW[win];
  const has = (k: string) => players.some((p) => typeof (p as any)[k] === "number");
  const primary = wanted.filter(has);
  // si la fenêtre est trop pauvre, fallback (union douce) vers 365
  if (primary.length >= 3) return primary;
  const fallback = KPI_BY_WINDOW["last_365d"].filter(has);
  const merged = [...new Set([...primary, ...fallback])];
  // garder 3–6 axes max sur un radar
  return merged.slice(0, 6);
}

/* ========================== Normalisations ========================== */

type ScaleChoice = "none" | "minmax" | "zscore";

function normalizeMatrix(rows: number[][], mode: ScaleChoice = "none"): number[][] {
  if (mode === "none") return rows;

  const nRows = rows.length;
  const nCols = rows[0]?.length ?? 0;
  if (!nRows || !nCols) return rows;

  const cols = Array.from({ length: nCols }, (_, j) => rows.map((r) => r[j]));
  const normCols = cols.map((col) => {
    const valid = col.filter((v) => Number.isFinite(v));
    if (valid.length === 0) return col.map(() => 0);

    if (mode === "minmax") {
      const min = Math.min(...valid);
      const max = Math.max(...valid);
      const range = max - min || 1;
      return col.map((v) => (Number.isFinite(v) ? (v - min) / range : 0));
    } else {
      // z-score
      const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
      const var_ = valid.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(valid.length - 1, 1);
      const sd = Math.sqrt(var_) || 1;
      return col.map((v) => (Number.isFinite(v) ? (v - mean) / sd : 0));
    }
  });

  // transpose back
  return rows.map((_, i) => normCols.map((c) => c[i]));
}

/* ========================== Recharts Mappers ========================== */

function toRadarSeries(label: string, axes: string[], values: number[]): Record<string, any>[] {
  return axes.map((k, i) => ({
    metric: titleCase(k.replace(/_avg_|_last_/g, " ").replace(/365d/g, "365d")),
    [label]: Number.isFinite(values[i]) ? values[i] : 0,
  }));
}

/* ========================== UI Composants ========================== */

function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-3 py-1.5 rounded-md border transition",
        active
          ? "bg-yellow-500 text-black border-yellow-400"
          : "bg-transparent text-white border-white/30 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-xl font-extrabold text-white mb-3">{title}</h3>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">{children}</div>
    </div>
  );
}

function PlayerRadar({
  player,
  axes,
  scale,
  colorKey,
}: {
  player: PlayerStats;
  axes: string[];
  scale: ScaleChoice;
  colorKey: string; // "A" | "B" ou similaire
}) {
  const vec = axes.map((k) => Number(player[k] as number) || 0);
  const norm = normalizeMatrix([vec], scale)[0];
  const data = toRadarSeries(player.player, axes, norm);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "white", fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fill: "white", fontSize: 10 }} stroke="#ffffff55" axisLine={false} />
          <Radar
            name={player.player}
            dataKey={player.player}
            fill={colorKey === "A" ? "#50B4FF99" : "#00D2AA99"}
            stroke={colorKey === "A" ? "#50B4FF" : "#00D2AA"}
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

function TeamRadar({
  team,
  axes,
  scale,
  colorKey,
}: {
  team: TeamStats;
  axes: string[];
  scale: ScaleChoice;
  colorKey: string;
}) {
  // moyenne des 5
  const rows = team.players.map((p) => axes.map((k) => Number(p[k] as number) || 0));
  const mean = axes.map((_, j) => {
    const vals = rows.map((r) => r[j]).filter((x) => Number.isFinite(x));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    // on pourrait aussi piocher team.aggregates[k] si tu préfères
  });

  const norm = normalizeMatrix([mean], scale)[0];
  const data = toRadarSeries(team.team, axes, norm);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "white", fontSize: 12 }} />
          <PolarRadiusAxis tick={{ fill: "white", fontSize: 10 }} stroke="#ffffff55" />
          <Radar
            name={team.team}
            dataKey={team.team}
            fill={colorKey === "A" ? "#50B4FF55" : "#00D2AA55"}
            stroke={colorKey === "A" ? "#50B4FF" : "#00D2AA"}
            fillOpacity={0.5}
          />
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ========================== Page principale ========================== */

export default function MatchDetails() {
  const location = useLocation();
  const q = useQuery();

  // Extract teams from URL path like /match/league/date/time/team1-vs-team2
  const pathParts = location.pathname.split('/').filter(Boolean);
  const matchString = pathParts[pathParts.length - 1] || "";
  
  // Parse "100-thieves-vs-t1" -> ["100-thieves", "t1"]
  const vsMatch = matchString.match(/^(.+)-vs-(.+)$/);
  let initialTeam1 = "";
  let initialTeam2 = "";
  
  if (vsMatch) {
    initialTeam1 = vsMatch[1].replace(/-/g, ' '); // "100-thieves" -> "100 thieves"
    initialTeam2 = vsMatch[2].replace(/-/g, ' '); // "t1" -> "t1"
  } else {
    // Fallback to query params
    initialTeam1 = q.get("team1") || "";
    initialTeam2 = q.get("team2") || "";
  }
  
  const league = pathParts[1] || q.get("league") || "";
  const bo = q.get("bo") || "BO3";
  const when = decodeURIComponent(pathParts[2] || "") || q.get("date") || "";
  
  console.log("[MatchDetails] Extracted teams:", { initialTeam1, initialTeam2, league, when, pathParts });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scale, setScale] = useState<ScaleChoice>("none");
  const [windowSel, setWindowSel] = useState<TimeWindow>("last_10");

  const [teamA, setTeamA] = useState<TeamStats | null>(null);
  const [teamB, setTeamB] = useState<TeamStats | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<Match | null>(null);

  // charge les données parquet via backend util
  useEffect(() => {
    let cancel = false;
    async function run() {
      setLoading(true);
      setError(null);
      setTeamA(null);
      setTeamB(null);
      try {
        const res = await parsePlayerDataParquet(initialTeam1, initialTeam2, scale);
        if (!res) {
          if (!cancel) setError("Impossible de lire les données joueurs (parquet).");
          return;
        }
        const [A, B] = res;
        if (!cancel) {
          setTeamA(A);
          setTeamB(B);
        }
      } catch (e: any) {
        if (!cancel) setError(String(e?.message || e));
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [initialTeam1, initialTeam2, scale]);

  // Load schedule to retrieve official team names, percents and logos
  useEffect(() => {
    async function loadSchedule() {
      try {
        const matches = await parseScheduleCSV();
        const t1Slug = slugify(initialTeam1);
        const t2Slug = slugify(initialTeam2);
        const leagueSlug = (pathParts[1] || "").toLowerCase();
        const dateSeg = decodeURIComponent(pathParts[2] || "");
        const timeSeg = decodeURIComponent(pathParts[3] || "");

        const found =
          matches.find(
            (m) =>
              slugify(m.team1) === t1Slug &&
              slugify(m.team2) === t2Slug &&
              slugify(m.tournament) === leagueSlug &&
              m.date === dateSeg &&
              m.time === timeSeg,
          ) ||
          matches.find((m) => slugify(m.team1) === t1Slug && slugify(m.team2) === t2Slug) ||
          matches.find((m) => slugify(m.team1) === t2Slug && slugify(m.team2) === t1Slug);

        setScheduleInfo(found ?? null);
      } catch (e) {
        setScheduleInfo(null);
      }
    }
    loadSchedule();
  }, [location.pathname, initialTeam1, initialTeam2]);

  const axes = useMemo(() => {
    const allPlayers = [...(teamA?.players || []), ...(teamB?.players || [])];
    return resolveAvailableKpis(allPlayers, windowSel);
  }, [teamA, teamB, windowSel]);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-4">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => history.back()}
          className="text-white/80 hover:text-white text-sm mb-3"
          aria-label="Retour"
        >
          ← Retour
        </button>
        <div className="flex items-center justify-center gap-8 text-center">
          {/* Team 1 */}
          <div className="flex flex-col items-center gap-2 min-w-[120px]">
            <img
              src={getTeamLogo(scheduleInfo?.team1 || titleCase(initialTeam1))}
              alt={scheduleInfo?.team1 || titleCase(initialTeam1)}
              className="w-14 h-14 object-contain"
            />
            <div className="font-bold text-white truncate max-w-[180px]">
              {scheduleInfo?.team1 || titleCase(initialTeam1)}
            </div>
            {scheduleInfo && (
              <div className="text-primary font-display text-xl">{Math.round(scheduleInfo.proba1)}%</div>
            )}
          </div>

          <div className="text-white/70 font-semibold">VS</div>

          {/* Team 2 */}
          <div className="flex flex-col items-center gap-2 min-w-[120px]">
            <img
              src={getTeamLogo(scheduleInfo?.team2 || titleCase(initialTeam2))}
              alt={scheduleInfo?.team2 || titleCase(initialTeam2)}
              className="w-14 h-14 object-contain"
            />
            <div className="font-bold text-white truncate max-w-[180px]">
              {scheduleInfo?.team2 || titleCase(initialTeam2)}
            </div>
            {scheduleInfo && (
              <div className="text-accent font-display text-xl">{Math.round(scheduleInfo.proba2)}%</div>
            )}
          </div>
        </div>
        <div className="text-center text-white/70 font-semibold mt-2">
          {league ? `${league} • ` : ""} {bo} {when ? `• ${when}` : ""}
        </div>
      </div>

      {/* Contrôles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="font-bold text-white mb-2">Fenêtre temporelle</div>
          <div className="flex gap-2 flex-wrap">
            {(["last_10", "last_20", "last_365d"] as TimeWindow[]).map((w) => (
              <Chip key={w} active={windowSel === w} onClick={() => setWindowSel(w)}>
                {w === "last_10" ? "10 derniers" : w === "last_20" ? "20 derniers" : "365 jours"}
              </Chip>
            ))}
          </div>
          <div className="text-xs text-white/60 mt-2">
            Si des métriques manquent pour la fenêtre choisie, on complète automatiquement avec les meilleures
            alternatives (ex: colonnes “365d”).
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="font-bold text-white mb-2">Normalisation</div>
          <div className="flex gap-2 flex-wrap">
            {(["none", "minmax", "zscore"] as ScaleChoice[]).map((m) => (
              <Chip key={m} active={scale === m} onClick={() => setScale(m)}>
                {m === "none" ? "Aucune" : m === "minmax" ? "Min-Max" : "Z-score"}
              </Chip>
            ))}
          </div>
          <div className="text-xs text-white/60 mt-2">
            La normalisation est appliquée <b>par radar</b> et <b>par métrique</b>.
          </div>
        </div>
      </div>

      {/* States */}
      {loading && <div className="text-white/80">Chargement des données…</div>}
      {error && <div className="text-red-300 bg-red-900/30 border border-red-700/40 rounded-md p-3">{error}</div>}

      {/* Contenu */}
      {!loading && !error && teamA && teamB && (
        <>
          {/* Résumé équipes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="font-extrabold text-white text-lg mb-2">{teamA.team}</div>
              {teamA.players.length ? (
                <>
                  <div className="text-white/80 text-sm mb-2">
                    Joueurs: {teamA.players.map((p) => p.player).join(", ")}
                  </div>
                  <TeamRadar team={teamA} axes={axes} scale={scale} colorKey="A" />
                </>
              ) : (
                <div className="text-white/60">Données insuffisantes</div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="font-extrabold text-white text-lg mb-2">{teamB.team}</div>
              {teamB.players.length ? (
                <>
                  <div className="text-white/80 text-sm mb-2">
                    Joueurs: {teamB.players.map((p) => p.player).join(", ")}
                  </div>
                  <TeamRadar team={teamB} axes={axes} scale={scale} colorKey="B" />
                </>
              ) : (
                <div className="text-white/60">Données insuffisantes</div>
              )}
            </div>
          </div>

          {/* Radars joueurs (5v5) */}
          <Section title="Comparaison joueurs (5v5)">
            {teamA.players.length === 0 || teamB.players.length === 0 ? (
              <div className="text-white/70">Joueurs manquants pour construire les radars.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamA.players.map((p, i) => (
                  <PlayerRadar key={`A-${p.player}-${i}`} player={p} axes={axes} scale={scale} colorKey="A" />
                ))}
                {teamB.players.map((p, i) => (
                  <PlayerRadar key={`B-${p.player}-${i}`} player={p} axes={axes} scale={scale} colorKey="B" />
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
