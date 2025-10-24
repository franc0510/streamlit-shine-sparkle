import { Navbar } from "@/components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { parseScheduleCSV, getTeamLogo } from "@/lib/csvParser";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
              <p className="text-xs text-muted-foreground">power_team: — | power_league: —</p>
            </div>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">{match.tournament} • {match.format}</p>
            <h1 className="text-3xl font-display font-bold my-2">{match.date} — {match.time}</h1>
            <p className="text-xs text-muted-foreground">Différences (équipe et joueurs) à venir</p>
          </div>

          <Card className="p-6 bg-gradient-card border-border/50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                <img src={team2Logo} alt={match.team2} className="w-24 h-24 object-contain" />
              </div>
              <h2 className="font-display text-xl font-bold">{match.team2}</h2>
              <Badge className="bg-accent/20 text-accent border-accent/30">{match.proba2.toFixed(0)}%</Badge>
              <p className="text-xs text-muted-foreground">power_team: — | power_league: —</p>
            </div>
          </Card>
        </div>

        <section className="mt-8">
          <h3 className="text-2xl font-display font-bold mb-4">Statistiques joueurs</h3>
          <Card className="p-6 bg-gradient-card border-border/50">
            <p className="text-sm text-muted-foreground">
              En attente du fichier Documents/DF_filtered.csv pour afficher les graphes par joueur (radar):
              kda_last_10, dpm_avg_last_365d, wcpm_avg_last_365d, vspm_avg_last_365d, earned_gpm_avg_last_365d, earned_gpm_avg_last_10.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Ordre d'affichage prévu: Top, Jungle, Mid, Bot, Support.</p>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default MatchDetails;
