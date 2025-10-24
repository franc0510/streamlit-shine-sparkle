import { Navbar } from "@/components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { parseScheduleCSV, getTeamLogo } from "@/lib/csvParser";
import { parsePlayerDataParquet, TeamStats, TimeWindow, ScaleMode } from "@/lib/parquetParser";
import { PlayerRadarChart } from "@/components/PlayerRadarChart";
import { TeamRadarChart } from "@/components/TeamRadarChart";
import { StatsControls } from "@/components/StatsControls";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";

const slugify = (s: string) => s
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9-]/g, "")
  .replace(/-+/g, "-");

const MatchDetails = () => {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [team1Stats, setTeam1Stats] = useState<TeamStats | null>(null);
  const [team2Stats, setTeam2Stats] = useState<TeamStats | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('last_10');
  const [scaleMode, setScaleMode] = useState<ScaleMode>('none');

  const [team1, team2] = useMemo(() => {
    const combo = (params.team1_vs_team2 || "").split("-vs-");
    return [combo[0]?.replace(/-/g, " "), combo[1]?.replace(/-/g, " ")];
  }, [params.team1_vs_team2]);

  useEffect(() => {
    document.title = `Détails du match | PredicteSport`;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const matches = await parseScheduleCSV();
        const m = matches.find(m =>
          slugify(m.tournament) === params.tournament &&
          m.date.toLowerCase().includes((params.date || "").toLowerCase()) &&
          m.time.startsWith((params.time || "")) &&
          slugify(m.team1) === slugify(team1 || "") &&
          slugify(m.team2) === slugify(team2 || "")
        );
        if (!m) {
          setNotFound(true);
        } else {
          setMatch(m);
          // Load player stats
          const stats = await parsePlayerDataParquet(m.team1, m.team2);
          if (stats) {
            setTeam1Stats(stats[0]);
            setTeam2Stats(stats[1]);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params, team1, team2]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement du match...</p>
      </div>
    );
  }

  if (notFound || !match) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <Card className="p-8 bg-gradient-card border-border/50">
            <p>Match introuvable.</p>
          </Card>
        </main>
      </div>
    );
  }

  const team1Logo = getTeamLogo(match.team1);
  const team2Logo = getTeamLogo(match.team2);

  const powerDiff = (team1Stats?.power_team || 0) - (team2Stats?.power_team || 0);
  const leaguePowerDiff = (team1Stats?.power_league || 0) - (team2Stats?.power_league || 0);

  const renderDiffIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="w-4 h-4 text-primary" />;
    if (diff < 0) return <TrendingDown className="w-4 h-4 text-accent" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour aux matchs
        </Link>

        <div className="grid gap-6 md:grid-cols-[1fr,auto,1fr] items-start">
          <Card className="p-6 bg-gradient-card border-border/50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                <img src={team1Logo} alt={match.team1} className="w-24 h-24 object-contain" />
              </div>
              <h2 className="font-display text-xl font-bold">{match.team1}</h2>
              <Badge className="bg-primary/20 text-primary border-primary/30">{match.proba1.toFixed(0)}%</Badge>
              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">Power Team: {team1Stats?.power_team?.toFixed(1) || '—'}</p>
                <p className="text-xs text-muted-foreground">Power League: {team1Stats?.power_league?.toFixed(1) || '—'}</p>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">{match.tournament} • {match.format}</p>
            <h1 className="text-3xl font-display font-bold my-2">{match.date} — {match.time}</h1>
            <div className="flex flex-col gap-1 mt-4">
              <div className="flex items-center justify-center gap-2">
                {renderDiffIcon(powerDiff)}
                <span className="text-xs text-muted-foreground">
                  Δ Power: {powerDiff > 0 ? '+' : ''}{powerDiff.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                {renderDiffIcon(leaguePowerDiff)}
                <span className="text-xs text-muted-foreground">
                  Δ League: {leaguePowerDiff > 0 ? '+' : ''}{leaguePowerDiff.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <Card className="p-6 bg-gradient-card border-border/50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                <img src={team2Logo} alt={match.team2} className="w-24 h-24 object-contain" />
              </div>
              <h2 className="font-display text-xl font-bold">{match.team2}</h2>
              <Badge className="bg-accent/20 text-accent border-accent/30">{match.proba2.toFixed(0)}%</Badge>
              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">Power Team: {team2Stats?.power_team?.toFixed(1) || '—'}</p>
                <p className="text-xs text-muted-foreground">Power League: {team2Stats?.power_league?.toFixed(1) || '—'}</p>
              </div>
            </div>
          </Card>
        </div>

        {team1Stats && team2Stats && (
          <>
            <section className="mt-8">
              <StatsControls 
                timeWindow={timeWindow}
                scaleMode={scaleMode}
                onTimeWindowChange={setTimeWindow}
                onScaleModeChange={setScaleMode}
              />
            </section>

            <section className="mb-8">
              <h3 className="text-2xl font-display font-bold mb-4">Radars d'équipe</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <TeamRadarChart 
                  team={match.team1}
                  aggregates={team1Stats.aggregates}
                  teamColor="hsl(var(--primary))"
                  timeWindow={timeWindow}
                />
                <TeamRadarChart 
                  team={match.team2}
                  aggregates={team2Stats.aggregates}
                  teamColor="hsl(var(--accent))"
                  timeWindow={timeWindow}
                />
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-display font-bold mb-4">Comparaison joueurs (5v5)</h3>
              
              {['top', 'jungle', 'mid', 'bot', 'support'].map((pos) => {
                const p1 = team1Stats.players.find(p => p.position === pos);
                const p2 = team2Stats.players.find(p => p.position === pos);
                if (!p1 && !p2) return null;

                return (
                  <div key={pos} className="mb-6">
                    <h4 className="text-lg font-semibold mb-3 uppercase text-muted-foreground">{pos}</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {p1 ? (
                        <PlayerRadarChart 
                          player={p1} 
                          teamColor="hsl(var(--primary))" 
                          timeWindow={timeWindow}
                        />
                      ) : (
                        <Card className="p-4 bg-gradient-card border-border/50 flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">Aucune donnée</p>
                        </Card>
                      )}
                      {p2 ? (
                        <PlayerRadarChart 
                          player={p2} 
                          teamColor="hsl(var(--accent))" 
                          timeWindow={timeWindow}
                        />
                      ) : (
                        <Card className="p-4 bg-gradient-card border-border/50 flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">Aucune donnée</p>
                        </Card>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {!team1Stats && !team2Stats && (
          <section className="mt-8">
            <h3 className="text-2xl font-display font-bold mb-4">Statistiques joueurs</h3>
            <Card className="p-6 bg-gradient-card border-border/50">
              <p className="text-sm text-muted-foreground">
                Chargement des statistiques...
              </p>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
};

export default MatchDetails;
