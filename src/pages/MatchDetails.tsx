import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
import PlayerRadarChart from "@/components/PlayerRadarChart";

/* ===================== helpers ===================== */
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

/* === Axes joueurs : gérés dans PlayerRadarChart === */

/* ===================== Composants ===================== */

function TeamSummary({ team, winrate, power }: { team: string; winrate?: number; power?: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-3">
      <div className="text-white font-extrabold text-lg">{team}</div>
      <div className="flex items-center gap-6 text-white/90">
        <div>
          <div className="text-white/60 text-xs">Winrate</div>
          <div className="text-white font-bold">
            {typeof winrate === "number" ? `${(winrate * 100).toFixed(1)}%` : "—"}
          </div>
        </div>
        <div>
          <div className="text-white/60 text-xs">Power team</div>
          <div className="text-white font-bold">{typeof power === "number" ? power.toFixed(2) : "—"}</div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Page ===================== */

export default function MatchDetails() {
  const location = useLocation();
  const q = useQuery();

  // /match/<league>/<date>/<time>/<team1>-vs-<team2>
  const pathParts = location.pathname.split("/").filter(Boolean);
  const matchString = pathParts[pathParts.length - 1] || "";
  const vsMatch = matchString.match(/^(.+)-vs-(.+)$/);

  let initialTeam1 = "";
  let initialTeam2 = "";
  if (vsMatch) {
    initialTeam1 = vsMatch[1].replace(/-/g, " ");
    initialTeam2 = vsMatch[2].replace(/-/g, " ");
  } else {
    initialTeam1 = q.get("team1") || "";
    initialTeam2 = q.get("team2") || "";
  }
  const league = pathParts[1] || q.get("league") || "";
  const bo = q.get("bo") || "BO3";
  const when = decodeURIComponent(pathParts[2] || "") || q.get("date") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scale, setScale] = useState<ScaleMode>("none");
  const [windowSel, setWindowSel] = useState<TimeWindow>("last_10");

  const [teamA, setTeamA] = useState<TeamStats | null>(null);
  const [teamB, setTeamB] = useState<TeamStats | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      setTeamA(null);
      setTeamB(null);
      try {
        const res = await parsePlayerDataParquet(initialTeam1, initialTeam2, scale);
        if (!res) throw new Error("Impossible de lire les données joueurs (parquet).");
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
    })();
    return () => {
      cancel = true;
    };
  }, [initialTeam1, initialTeam2, scale]);

  const winrateFor = (t: TeamStats | null, win: TimeWindow) => {
    if (!t) return undefined;
    if (win === "last_10") return t.meta.team_winrate_last_10;
    if (win === "last_20") return t.meta.team_winrate_last_20;
    return t.meta.team_winrate_last_year;
  };

  return (
    <div className="px-4 md:px-8 lg:px-12 py-4">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-2xl md:text-3xl font-black text-white">
          {initialTeam1} <span className="text-white/70">vs</span> {initialTeam2}
        </div>
        <div className="text-white/70 font-semibold">
          {league ? `${league} • ` : ""} {bo} {when ? `• ${when}` : ""}
        </div>
      </div>

      {/* Controls */}
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
            Les radars joueurs utilisent <b>uniquement</b> les métriques de la fenêtre choisie.
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="font-bold text-white mb-2">Normalisation</div>
          <div className="flex gap-2 flex-wrap">
            {(["none", "minmax", "zscore"] as ScaleMode[]).map((m) => (
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
          {/* Résumé équipes (PAS de radar d'équipe) */}
          <div className="grid md:grid-cols-2 gap-4">
            <TeamSummary team={teamA.team} winrate={winrateFor(teamA, windowSel)} power={teamA.meta.power_team} />
            <TeamSummary team={teamB.team} winrate={winrateFor(teamB, windowSel)} power={teamB.meta.power_team} />
          </div>

          {/* Radars joueurs (5 axes pour 10/20, 4 pour 365d) */}
          <Section title="Comparaison joueurs (5v5)">
            {!teamA.players.length || !teamB.players.length ? (
              <div className="text-white/70">Joueurs manquants pour construire les radars.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamA.players.map((p, i) => (
                  <PlayerRadarChart
                    key={`A-${p.player}-${i}`}
                    player={p}
                    timeWindow={windowSel}
                    scaleMode={scale}
                    accentColor="#50B4FF"
                  />
                ))}
                {teamB.players.map((p, i) => (
                  <PlayerRadarChart
                    key={`B-${p.player}-${i}`}
                    player={p}
                    timeWindow={windowSel}
                    scaleMode={scale}
                    accentColor="#00D2AA"
                  />
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
