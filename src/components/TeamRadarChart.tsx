import { Card } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { TeamAggregates, TimeWindow } from "@/lib/parquetParser";

interface TeamRadarChartProps {
  team: string;
  aggregates: TeamAggregates;
  teamColor: string;
  timeWindow: TimeWindow;
}

export const TeamRadarChart = ({ team, aggregates, teamColor, timeWindow }: TeamRadarChartProps) => {
  const buildData = () => {
    const data: Array<{ stat: string; value: number; fullMark: number }> = [];

    if (timeWindow === 'last_10') {
      if (aggregates.kda_last_10 != null) {
        data.push({ stat: 'KDA\n(10g)', value: aggregates.kda_last_10, fullMark: 10 });
      }
      if (aggregates.earned_gpm_last_10 != null) {
        data.push({ stat: 'GPM\n(10g)', value: aggregates.earned_gpm_last_10, fullMark: 400 });
      }
      if (aggregates.dpm_365d != null) {
        data.push({ stat: 'DPM\n(365j)', value: aggregates.dpm_365d, fullMark: 800 });
      }
      if (aggregates.wcpm_365d != null) {
        data.push({ stat: 'WCPM\n(365j)', value: aggregates.wcpm_365d, fullMark: 1.5 });
      }
      if (aggregates.vspm_365d != null) {
        data.push({ stat: 'VSPM\n(365j)', value: aggregates.vspm_365d, fullMark: 2 });
      }
    } else if (timeWindow === 'last_20') {
      if (aggregates.kda_last_20 != null) {
        data.push({ stat: 'KDA\n(20g)', value: aggregates.kda_last_20, fullMark: 10 });
      } else if (aggregates.kda_last_10 != null) {
        data.push({ stat: 'KDA\n(10g)', value: aggregates.kda_last_10, fullMark: 10 });
      }
      if (aggregates.earned_gpm_last_20 != null) {
        data.push({ stat: 'GPM\n(20g)', value: aggregates.earned_gpm_last_20, fullMark: 400 });
      } else if (aggregates.earned_gpm_last_10 != null) {
        data.push({ stat: 'GPM\n(10g)', value: aggregates.earned_gpm_last_10, fullMark: 400 });
      }
      if (aggregates.dpm_365d != null) {
        data.push({ stat: 'DPM\n(365j)', value: aggregates.dpm_365d, fullMark: 800 });
      }
      if (aggregates.wcpm_365d != null) {
        data.push({ stat: 'WCPM\n(365j)', value: aggregates.wcpm_365d, fullMark: 1.5 });
      }
      if (aggregates.vspm_365d != null) {
        data.push({ stat: 'VSPM\n(365j)', value: aggregates.vspm_365d, fullMark: 2 });
      }
    } else {
      // last_365d
      if (aggregates.dpm_365d != null) {
        data.push({ stat: 'DPM\n(365j)', value: aggregates.dpm_365d, fullMark: 800 });
      }
      if (aggregates.wcpm_365d != null) {
        data.push({ stat: 'WCPM\n(365j)', value: aggregates.wcpm_365d, fullMark: 1.5 });
      }
      if (aggregates.vspm_365d != null) {
        data.push({ stat: 'VSPM\n(365j)', value: aggregates.vspm_365d, fullMark: 2 });
      }
      if (aggregates.earned_gpm_365d != null) {
        data.push({ stat: 'GPM\n(365j)', value: aggregates.earned_gpm_365d, fullMark: 400 });
      }
    }

    return data;
  };

  const data = buildData();

  if (data.length === 0) {
    return (
      <Card className="p-4 bg-gradient-card border-border/50">
        <div className="text-center">
          <h4 className="font-semibold mb-2">{team}</h4>
          <p className="text-xs text-muted-foreground">Données insuffisantes</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-card border-border/50">
      <h4 className="font-semibold text-center mb-3">{team} (Moyennes)</h4>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="stat" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={false} />
          <Radar 
            name={team}
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
