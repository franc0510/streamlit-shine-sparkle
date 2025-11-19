import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MatchCardProps {
  tournament: string;
  date: string;
  time: string;
  format: string;
  team1: {
    name: string;
    logo: string;
    winProbability: number;
  };
  team2: {
    name: string;
    logo: string;
    winProbability: number;
  };
  minOdds: {
    team1: number;
    team2: number;
  };
}

export const MatchCard = ({ tournament, date, time, format, team1, team2, minOdds }: MatchCardProps) => {
  return (
    <Card className="group relative overflow-hidden bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 animate-slide-up">
      <div className="absolute inset-0 bg-gradient-gaming opacity-0 group-hover:opacity-5 transition-opacity" />
      
      <div className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Badge variant="secondary" className="mb-2 bg-secondary/80">
              {tournament}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {date} — {time}
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {format}
          </Badge>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
              <img 
                src={team1.logo} 
                alt={team1.name} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/Documents/teams/shaco.png';
                }}
              />
            </div>
            <h3 className="font-semibold text-center text-sm">{team1.name}</h3>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-display font-bold text-primary">
                {team1.winProbability}%
              </span>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${team1.winProbability}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 px-4">
            <span className="text-2xl font-bold text-muted-foreground">VS</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
              <img 
                src={team2.logo} 
                alt={team2.name} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/Documents/teams/shaco.png';
                }}
              />
            </div>
            <h3 className="font-semibold text-center text-sm">{team2.name}</h3>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-display font-bold text-accent">
                {team2.winProbability}%
              </span>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-500"
                  style={{ width: `${team2.winProbability}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            Probabilité de victoire de série ({format})
          </p>
          <p className="text-xs text-foreground/80">
            Cotes minimum +EV — {team1.name}: ≥ {minOdds.team1.toFixed(2)} • {team2.name}: ≥{" "}
            {minOdds.team2.toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  );
};
