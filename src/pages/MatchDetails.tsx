import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";

import { parsePlayerDataParquet, type TeamStats, type ScaleMode, type TimeWindow } from "@/lib/parquetParser";
import { getTeamLogo } from "@/lib/csvParser";
import PlayerRadarChart from "@/components/PlayerRadarChart";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

/* ===================== helpers ===================== */
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
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

/* ===================== utils ===================== */
const normalizePos = (pos?: string) => {
  const p = (pos || "").toLowerCase().trim();
  if (["top", "toplane", "top lane"].includes(p)) return "top";
  if (["jg", "jng", "jungle"].includes(p)) return "jungle";
  if (["mid", "middle", "midlane", "mid lane"].includes(p)) return "mid";
  if (["bot", "bottom", "adc", "ad carry", "marksman"].includes(p)) return "bot";
  if (["sup", "support", "supp"].includes(p)) return "support";
  return p as any;
};

/* ===================== Page ===================== */

export default function MatchDetails() {
  const location = useLocation();
  const navigate = useNavigate();
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

  const logo1 = teamA?.team ? getTeamLogo(teamA.team) : getTeamLogo(initialTeam1);
  const logo2 = teamB?.team ? getTeamLogo(teamB.team) : getTeamLogo(initialTeam2);
  const logo1Alt = logo1.replace(/_/g, " ");
  const logo2Alt = logo2.replace(/_/g, " ");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="px-4 md:px-8 lg:px-12 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>

        {/* Teams VS Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="flex flex-col items-center gap-3">
              <img
                src={logo1}
                alt={teamA?.team || initialTeam1}
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.dataset.fallbackTried !== '1') {
                    img.dataset.fallbackTried = '1';
                    img.src = logo1Alt;
                  } else {
                    img.src = '/Documents/teams/TBD.png';
                  }
                }}
              />
              <div className="text-xl font-bold text-white">{teamA?.team || initialTeam1}</div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl font-black text-white/70">VS</div>
              {teamA && teamB && (
                <div className="text-sm text-white/60">
                  Power Δ:{" "}
                  <span className={clsx("font-bold", 
                    (teamA.meta.power_team || 0) > (teamB.meta.power_team || 0) 
                      ? "text-green-400" 
                      : "text-red-400"
                  )}>
                    {((teamA.meta.power_team || 0) - (teamB.meta.power_team || 0)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-3">
              <img
                src={logo2}
                alt={teamB?.team || initialTeam2}
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.dataset.fallbackTried !== '1') {
                    img.dataset.fallbackTried = '1';
                    img.src = logo2Alt;
                  } else {
                    img.src = '/Documents/teams/TBD.png';
                  }
                }}
              />
              <div className="text-xl font-bold text-white">{teamB?.team || initialTeam2}</div>
            </div>
          </div>

          <div className="text-center text-white/70 font-semibold">
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
            {/* Résumé équipes */}
            <div className="grid md:grid-cols-2 gap-4">
              <TeamSummary team={teamA.team} winrate={winrateFor(teamA, windowSel)} power={teamA.meta.power_team} />
              <TeamSummary team={teamB.team} winrate={winrateFor(teamB, windowSel)} power={teamB.meta.power_team} />
            </div>

            {/* Comparaison joueurs par position */}
            <Section title="Comparaison joueurs (5v5)">
              {!teamA.players.length || !teamB.players.length ? (
                <div className="text-white/70">Joueurs manquants pour construire les radars.</div>
              ) : (
                <div className="space-y-6">
                  {(["top", "jungle", "mid", "bot", "support"] as const).map((position) => {
                    const playerA = teamA.players.find(
                      (p) => normalizePos(p.position) === position
                    );
                    const playerB = teamB.players.find(
                      (p) => normalizePos(p.position) === position
                    );

                    if (!playerA && !playerB) return null;

                    // Calculate KPI difference for the selected window
                    const KPI_BY_WINDOW: Record<TimeWindow, string[]> = {
                      last_10: ["kda_last_10", "earned_gpm_avg_last_10", "cspm_avg_last_10", "vspm_avg_last_10", "dpm_avg_last_10"],
                      last_20: ["kda_last_20", "earned_gpm_avg_last_20", "cspm_avg_last_20", "vspm_avg_last_20", "dpm_avg_last_20"],
                      last_365d: ["earned_gpm_avg_last_365d", "cspm_avg_last_365d", "vspm_avg_last_365d", "dpm_avg_last_365d"],
                    };

                    const kpis = KPI_BY_WINDOW[windowSel];
                    let totalDiff = 0;
                    let count = 0;

                    if (playerA && playerB) {
                      kpis.forEach((kpi) => {
                        const valA = Number((playerA as any)[kpi]);
                        const valB = Number((playerB as any)[kpi]);
                        if (Number.isFinite(valA) && Number.isFinite(valB)) {
                          totalDiff += valA - valB;
                          count++;
                        }
                      });
                    }

                    const avgDiff = count > 0 ? totalDiff / count : 0;

                    return (
                      <div key={position} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <h4 className="text-center text-white/80 font-bold uppercase text-sm mb-4">
                          {position}
                        </h4>
                        <div className="grid md:grid-cols-3 gap-4 items-center">
                          {/* Player A (left) */}
                          <div>
                            {playerA ? (
                              <PlayerRadarChart
                                player={playerA}
                                timeWindow={windowSel}
                                scaleMode={scale}
                                accentColor="#50B4FF"
                              />
                            ) : (
                              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white/50">
                                Pas de joueur
                              </div>
                            )}
                          </div>

                          {/* Difference (middle) */}
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="text-white/60 text-xs uppercase">Δ Moyenne</div>
                            <div
                              className={clsx(
                                "text-3xl font-black",
                                avgDiff > 0 ? "text-green-400" : avgDiff < 0 ? "text-red-400" : "text-white/50"
                              )}
                            >
                              {avgDiff > 0 ? "+" : ""}
                              {avgDiff.toFixed(2)}
                            </div>
                            <div className="text-white/40 text-xs text-center">
                              (basé sur les KPIs sélectionnés)
                            </div>
                          </div>

                          {/* Player B (right) */}
                          <div>
                            {playerB ? (
                              <PlayerRadarChart
                                player={playerB}
                                timeWindow={windowSel}
                                scaleMode={scale}
                                accentColor="#00D2AA"
                              />
                            ) : (
                              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white/50">
                                Pas de joueur
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
