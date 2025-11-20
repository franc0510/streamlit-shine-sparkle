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
      
      <div className="p-3 sm:p-4 md:p-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
          <div>
            <Badge variant="secondary" className="mb-1.5 sm:mb-2 bg-secondary/80 text-xs">
              {tournament}
            </Badge>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {date} — {time}
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs w-fit">
            {format}
          </Badge>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 md:gap-6 items-center">
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
              <img 
                src={team1.logo} 
                alt={team1.name} 
                className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/Documents/teams/shaco.png';
                }}
              />
            </div>
            <h3 className="font-semibold text-center text-xs sm:text-sm line-clamp-2">{team1.name}</h3>
            <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full">
              <span className="text-lg sm:text-xl md:text-2xl font-display font-bold text-primary">
                {team1.winProbability}%
              </span>
              <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2">
                <div
                  className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${team1.winProbability}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 px-1 sm:px-2 md:px-4">
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-muted-foreground">VS</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
              <img 
                src={team2.logo} 
                alt={team2.name} 
                className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/Documents/teams/shaco.png';
                }}
              />
            </div>
            <h3 className="font-semibold text-center text-xs sm:text-sm line-clamp-2">{team2.name}</h3>
            <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full">
              <span className="text-lg sm:text-xl md:text-2xl font-display font-bold text-accent">
                {team2.winProbability}%
              </span>
              <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2">
                <div
                  className="bg-accent h-1.5 sm:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${team2.winProbability}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 md:mt-6 pt-3 sm:pt-4 md:pt-6 border-t border-border/50">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2 font-medium">
            Probabilité de victoire de série ({format})
          </p>
          <p className="text-[10px] sm:text-xs text-foreground/80 leading-relaxed">
            Cotes minimum +EV — {team1.name}: ≥ {minOdds.team1.toFixed(2)} • {team2.name}: ≥{" "}
            {minOdds.team2.toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  );
};
