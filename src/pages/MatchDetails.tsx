import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";

import { parsePlayerDataParquet, type TeamStats, type ScaleMode, type TimeWindow } from "@/lib/parquetParser";
import { getTeamLogo } from "@/lib/csvParser";
import PlayerRadarChart from "@/components/PlayerRadarChart";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { PremiumGate } from "@/components/PremiumGate";
import { useMatchAccess } from "@/hooks/useMatchAccess";

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
        active ? "bg-yellow-500 text-black border-yellow-400" : "bg-transparent text-white border-white/30 hover:bg-white/10"
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

const normalizePos = (pos?: string) => {
  const p = (pos || "").toLowerCase().trim();
  if (["top", "toplane", "top lane"].includes(p)) return "top";
  if (["jg", "jgl", "jng", "jungle"].includes(p)) return "jungle";
  if (["mid", "middle", "midlane", "mid lane"].includes(p)) return "mid";
  if (["bot", "bottom", "adc", "ad carry", "marksman"].includes(p)) return "bot";
  if (["sup", "support", "supp"].includes(p)) return "support";
  return p as any;
};

export default function MatchDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const q = useQuery();
  const { viewedCount, canViewMatch, markMatchAsViewed, isMatchViewed } = useMatchAccess();

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
  const bo = q.get("bo") || "BO5";
  const when = decodeURIComponent(pathParts[2] || "") || q.get("date") || "";

  const matchId = `${league}_${when}_${initialTeam1}_${initialTeam2}`;
  const hasAccessToThisMatch = canViewMatch(matchId);

  useEffect(() => {
    if (hasAccessToThisMatch && !isMatchViewed(matchId)) {
      markMatchAsViewed(matchId);
    }
  }, [matchId, hasAccessToThisMatch, isMatchViewed, markMatchAsViewed]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale] = useState<ScaleMode>("none");
  const [windowSel, setWindowSel] = useState<TimeWindow>("last_20");
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
    return () => { cancel = true; };
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
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour à League of Legends
        </Button>

        {!hasAccessToThisMatch ? (
          <PremiumGate freeLimit={1} currentCount={viewedCount} featureName="matchs">
            <div></div>
          </PremiumGate>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden hover:scale-110 transition-transform">
                    <img src={logo1} alt={teamA?.team || initialTeam1} className="w-20 h-20 object-contain"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.dataset.fallbackTried !== '1') {
                          img.dataset.fallbackTried = '1';
                          img.src = logo1Alt;
                        } else {
                          img.src = '/Documents/teams/shaco.png';
                        }
                      }}
                    />
                  </div>
                  <div className="text-xl font-bold text-white">{teamA?.team || initialTeam1}</div>
                </div>

                <div className="flex flex-col items-center gap-3 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 blur-xl"></div>
                  <div className="relative text-5xl font-black text-white animate-pulse">VS</div>
                  {teamA && teamB && (
                    <div className="relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-6">
                        <div className="text-center min-w-[80px]">
                          <div className="text-white/60 text-xs mb-1">Winrate</div>
                          <div className="text-white font-bold text-lg">
                            {typeof winrateFor(teamA, windowSel) === "number" ? `${(winrateFor(teamA, windowSel)! * 100).toFixed(1)}%` : "—"}
                          </div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-white/40 text-xs mb-1">Δ WR</div>
                          <div className={clsx("text-xl font-black", ((winrateFor(teamA, windowSel) || 0) - (winrateFor(teamB, windowSel) || 0)) > 0 ? "text-green-400" : "text-red-400")}>
                            {typeof winrateFor(teamA, windowSel) === "number" && typeof winrateFor(teamB, windowSel) === "number"
                              ? (((winrateFor(teamA, windowSel)! - winrateFor(teamB, windowSel)!) * 100).toFixed(1)) : "—"}%
                          </div>
                        </div>
                        <div className="text-center min-w-[80px]">
                          <div className="text-white/60 text-xs mb-1">Winrate</div>
                          <div className="text-white font-bold text-lg">
                            {typeof winrateFor(teamB, windowSel) === "number" ? `${(winrateFor(teamB, windowSel)! * 100).toFixed(1)}%` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden hover:scale-110 transition-transform">
                    <img src={logo2} alt={teamB?.team || initialTeam2} className="w-20 h-20 object-contain"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.dataset.fallbackTried !== '1') {
                          img.dataset.fallbackTried = '1';
                          img.src = logo2Alt;
                        } else {
                          img.src = '/Documents/teams/shaco.png';
                        }
                      }}
                    />
                  </div>
                  <div className="text-xl font-bold text-white">{teamB?.team || initialTeam2}</div>
                </div>
              </div>
              <div className="text-center text-white/70 font-semibold">
                {league ? `${league} • ` : ""} {bo} {when ? `• ${when}` : ""}
              </div>
            </div>

            {loading && <div className="text-white/80">Chargement des données…</div>}
            {error && <div className="text-red-300 bg-red-900/30 border border-red-700/40 rounded-md p-3">{error}</div>}

            {!loading && !error && teamA && teamB && (
              <>
                <div className="mb-6">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="font-bold text-white mb-3">Fenêtre temporelle</div>
                    <div className="flex gap-2 flex-wrap">
                      {(["last_10", "last_20", "last_365d"] as TimeWindow[]).map((w) => (
                        <Chip key={w} active={windowSel === w} onClick={() => setWindowSel(w)}>
                          {w === "last_10" ? "10 derniers series" : w === "last_20" ? "20 derniers series" : "365 jours"}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>

                <Section title="Comparaison joueurs (5v5)">
                  {!teamA.players.length || !teamB.players.length ? (
                    <div className="text-white/70">Joueurs manquants pour construire les radars.</div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        const KPI_BY_WINDOW: Record<TimeWindow, string[]> = {
                          last_10: ["kda_last_10", "earned_gpm_avg_last_10", "cspm_avg_last_10", "vspm_avg_last_10", "dpm_avg_last_10"],
                          last_20: ["kda_last_20", "earned_gpm_avg_last_20", "cspm_avg_last_20", "vspm_avg_last_20", "dpm_avg_last_20"],
                          last_365d: ["earned_gpm_avg_last_365d", "cspm_avg_last_365d", "vspm_avg_last_365d", "dpm_avg_last_365d"],
                        };
                        const kpis = KPI_BY_WINDOW[windowSel];
                        const allPlayers = [...teamA.players, ...teamB.players];
                        const globalMinMax: Record<string, { min: number; max: number }> = {};
                        
                        kpis.forEach((kpi) => {
                          const values = allPlayers.map((p) => Number((p as any)[kpi])).filter((v) => Number.isFinite(v));
                          if (values.length > 0) {
                            globalMinMax[kpi] = { min: Math.min(...values), max: Math.max(...values) };
                          }
                        });

                        return ["top", "jungle", "mid", "bot", "support"].map((position) => {
                          const playerA = teamA.players.find((p: any) => normalizePos(p.position) === position);
                          const playerB = teamB.players.find((p: any) => normalizePos(p.position) === position);
                          
                          return (
                            <div key={position} className="space-y-3">
                              <div className="flex items-center justify-center gap-4 mb-2">
                                <div className="text-white/60 text-xs uppercase tracking-wider font-bold">
                                  {position === "top" ? "TOP" : position === "jungle" ? "JUNGLE" : position === "mid" ? "MID" : position === "bot" ? "ADC" : "SUPPORT"}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="text-center text-white/80 font-semibold text-sm">{playerA?.player || "—"}</div>
                                  {playerA ? (
                                    <PlayerRadarChart player={playerA} timeWindow={windowSel} globalMinMax={globalMinMax} accentColor="#00D2FF" />
                                  ) : (
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white/50">
                                      <div className="mb-2">Pas de joueur</div>
                                      <div className="text-xs text-white/30">(Position: {position})</div>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <div className="text-center text-white/80 font-semibold text-sm">{playerB?.player || "—"}</div>
                                  {playerB ? (
                                    <PlayerRadarChart player={playerB} timeWindow={windowSel} globalMinMax={globalMinMax} accentColor="#00D2AA" />
                                  ) : (
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white/50">
                                      <div className="mb-2">Pas de joueur</div>
                                      <div className="text-xs text-white/30">(Position: {position})</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </Section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
