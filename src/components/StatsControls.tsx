import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TimeWindow, ScaleMode } from "@/lib/parquetParser";

interface StatsControlsProps {
  timeWindow: TimeWindow;
  scaleMode: ScaleMode;
  onTimeWindowChange: (window: TimeWindow) => void;
  onScaleModeChange: (mode: ScaleMode) => void;
}

export const StatsControls = ({ 
  timeWindow, 
  scaleMode, 
  onTimeWindowChange, 
  onScaleModeChange 
}: StatsControlsProps) => {
  return (
    <Card className="p-4 bg-gradient-card border-border/50 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Fenêtre temporelle
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={timeWindow === 'last_10' ? 'default' : 'outline'}
              onClick={() => onTimeWindowChange('last_10')}
            >
              10 derniers
            </Button>
            <Button
              size="sm"
              variant={timeWindow === 'last_20' ? 'default' : 'outline'}
              onClick={() => onTimeWindowChange('last_20')}
            >
              20 derniers
            </Button>
            <Button
              size="sm"
              variant={timeWindow === 'last_365d' ? 'default' : 'outline'}
              onClick={() => onTimeWindowChange('last_365d')}
            >
              365 jours
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Normalisation
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={scaleMode === 'none' ? 'default' : 'outline'}
              onClick={() => onScaleModeChange('none')}
            >
              Aucune
            </Button>
            <Button
              size="sm"
              variant={scaleMode === 'minmax' ? 'default' : 'outline'}
              onClick={() => onScaleModeChange('minmax')}
            >
              Min-Max
            </Button>
            <Button
              size="sm"
              variant={scaleMode === 'zscore' ? 'default' : 'outline'}
              onClick={() => onScaleModeChange('zscore')}
            >
              Z-score
            </Button>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-3">
        Les métriques non disponibles pour la fenêtre sélectionnée sont omises du radar.
      </p>
    </Card>
  );
};
