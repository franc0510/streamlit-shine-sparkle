import { Card } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { PlayerStats, getPlayerImage } from "@/lib/parquetParser";

interface PlayerRadarChartProps {
  player: PlayerStats;
  teamColor: string;
}

export const PlayerRadarChart = ({ player, teamColor }: PlayerRadarChartProps) => {
  const data = [
    { stat: 'KDA\n(10g)', value: player.kda_last_10 || 0, fullMark: 10 },
    { stat: 'DPM\n(365j)', value: player.dpm_avg_last_365d || 0, fullMark: 800 },
    { stat: 'WCPM\n(365j)', value: player.wcpm_avg_last_365d || 0, fullMark: 1.5 },
    { stat: 'VSPM\n(365j)', value: player.vspm_avg_last_365d || 0, fullMark: 2 },
    { stat: 'GPM\n(365j)', value: player.earned_gpm_avg_last_365d || 0, fullMark: 400 },
    { stat: 'GPM\n(10g)', value: player.earned_gpm_avg_last_10 || 0, fullMark: 400 },
  ];

  const playerImg = getPlayerImage(player.player_name);

  return (
    <Card className="p-4 bg-gradient-card border-border/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden">
          <img 
            src={playerImg} 
            alt={player.player_name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/Documents/players/imagenotfound.jpg';
            }}
          />
        </div>
        <div>
          <h4 className="font-semibold">{player.player_name}</h4>
          <p className="text-xs text-muted-foreground uppercase">{player.position}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="stat" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={false} />
          <Radar 
            name={player.player_name}
            dataKey="value" 
            stroke={teamColor}
            fill={teamColor}
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
};
