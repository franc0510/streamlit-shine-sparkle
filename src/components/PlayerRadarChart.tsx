import { Card } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { PlayerStats, getPlayerImage, TimeWindow, ScaleMode } from "@/lib/parquetParser";

interface PlayerRadarChartProps {
  player: PlayerStats;
  teamColor: string;
  timeWindow: TimeWindow;
  scaleMode: ScaleMode;
}

export const PlayerRadarChart = ({ player, teamColor, timeWindow, scaleMode }: PlayerRadarChartProps) => {
  const buildData = () => {
    const data: Array<{ stat: string; value: number; fullMark: number }> = [];
    const isNormalized = scaleMode !== 'none';

    if (timeWindow === 'last_10') {
      if (player.kda_last_10 != null) {
        data.push({ stat: 'KDA\n(10g)', value: player.kda_last_10, fullMark: isNormalized ? 1 : 10 });
      }
      if (player.earned_gpm_avg_last_10 != null) {
        data.push({ stat: 'GPM\n(10g)', value: player.earned_gpm_avg_last_10, fullMark: isNormalized ? 1 : 400 });
      }
      if (player.dpm_avg_last_365d != null) {
        data.push({ stat: 'DPM\n(365j)', value: player.dpm_avg_last_365d, fullMark: isNormalized ? 1 : 800 });
      }
      if (player.wcpm_avg_last_365d != null) {
        data.push({ stat: 'WCPM\n(365j)', value: player.wcpm_avg_last_365d, fullMark: isNormalized ? 1 : 1.5 });
      }
      if (player.vspm_avg_last_365d != null) {
        data.push({ stat: 'VSPM\n(365j)', value: player.vspm_avg_last_365d, fullMark: isNormalized ? 1 : 2 });
      }
    } else if (timeWindow === 'last_20') {
      if (player.kda_last_20 != null) {
        data.push({ stat: 'KDA\n(20g)', value: player.kda_last_20, fullMark: isNormalized ? 1 : 10 });
      } else if (player.kda_last_10 != null) {
        data.push({ stat: 'KDA\n(10g)', value: player.kda_last_10, fullMark: isNormalized ? 1 : 10 });
      }
      if (player.earned_gpm_avg_last_10 != null) {
        data.push({ stat: 'GPM\n(10g)', value: player.earned_gpm_avg_last_10, fullMark: isNormalized ? 1 : 400 });
      }
      if (player.dpm_avg_last_365d != null) {
        data.push({ stat: 'DPM\n(365j)', value: player.dpm_avg_last_365d, fullMark: isNormalized ? 1 : 800 });
      }
      if (player.wcpm_avg_last_365d != null) {
        data.push({ stat: 'WCPM\n(365j)', value: player.wcpm_avg_last_365d, fullMark: isNormalized ? 1 : 1.5 });
      }
      if (player.vspm_avg_last_365d != null) {
        data.push({ stat: 'VSPM\n(365j)', value: player.vspm_avg_last_365d, fullMark: isNormalized ? 1 : 2 });
      }
    } else {
      // last_365d
      if (player.dpm_avg_last_365d != null) {
        data.push({ stat: 'DPM\n(365j)', value: player.dpm_avg_last_365d, fullMark: isNormalized ? 1 : 800 });
      }
      if (player.wcpm_avg_last_365d != null) {
        data.push({ stat: 'WCPM\n(365j)', value: player.wcpm_avg_last_365d, fullMark: isNormalized ? 1 : 1.5 });
      }
      if (player.vspm_avg_last_365d != null) {
        data.push({ stat: 'VSPM\n(365j)', value: player.vspm_avg_last_365d, fullMark: isNormalized ? 1 : 2 });
      }
      if (player.earned_gpm_avg_last_365d != null) {
        data.push({ stat: 'GPM\n(365j)', value: player.earned_gpm_avg_last_365d, fullMark: isNormalized ? 1 : 400 });
      }
    }

    return data;
  };

  const data = buildData();
  const playerImg = getPlayerImage(player.player_name);

  if (data.length === 0) {
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
        <p className="text-xs text-muted-foreground text-center">Données insuffisantes</p>
      </Card>
    );
  }

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
