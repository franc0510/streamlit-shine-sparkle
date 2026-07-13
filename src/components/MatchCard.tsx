import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { BookmakerOdds, BetRecommendation } from "@/lib/csvParser";

interface MatchCardProps {
  tournament: string;
  date: string;
  time: string;
  format: string;
  team1: {
    name: string;
    logo: string;
    winProbability: number;
    usedName?: string;
  };
  team2: {
    name: string;
    logo: string;
    winProbability: number;
    usedName?: string;
  };
  minOdds: {
    team1: number;
    team2: number;
  };
  pinnacleOdds?: BookmakerOdds;
  unibetOdds?: BookmakerOdds;
  polymarketOdds?: BookmakerOdds;
  stakeOdds?: BookmakerOdds;
  recoPinnacle?: BetRecommendation;
  recoStake?: BetRecommendation;
  bestBet?: {
    bookmaker: string;
    text: string;
    odds: number | null;
    ev: number | null;
  };
}

const OddsCell = ({ label, odds, recommendedSide, affiliateUrl, betLabel }: { label: string; odds?: BookmakerOdds; recommendedSide?: 'team1' | 'team2' | null; affiliateUrl?: string; betLabel?: string }) => {
  if (!odds || (odds.team1 === null && odds.team2 === null)) return null;
  return (
    <div className="flex items-center justify-between text-[10px] sm:text-xs">
      <span className="text-muted-foreground font-medium flex items-center gap-1">
        {label}
        {affiliateUrl && (
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-primary/20 border border-emerald-500/40 text-emerald-400 hover:from-emerald-500/40 hover:to-primary/40 hover:scale-110 transition-all duration-200 font-bold tracking-wide"
          >
            {betLabel || 'Parier ↗'}
          </a>
        )}
      </span>
      <div className="flex gap-3">
        <span className={`font-semibold ${recommendedSide === 'team1' ? 'text-emerald-400' : 'text-foreground'}`}>
          {odds.team1?.toFixed(2) ?? '—'}{recommendedSide === 'team1' ? ' ⭐' : ''}
        </span>
        <span className="text-muted-foreground/50">|</span>
        <span className={`font-semibold ${recommendedSide === 'team2' ? 'text-emerald-400' : 'text-foreground'}`}>
          {odds.team2?.toFixed(2) ?? '—'}{recommendedSide === 'team2' ? ' ⭐' : ''}
        </span>
      </div>
    </div>
  );
};

export const MatchCard = ({ tournament, date, time, format, team1, team2, minOdds, pinnacleOdds, unibetOdds, polymarketOdds, stakeOdds, recoPinnacle, recoStake, bestBet }: MatchCardProps) => {
  const { t } = useTranslation();

  const hasOdds = pinnacleOdds?.team1 !== null || unibetOdds?.team1 !== null || polymarketOdds?.team1 !== null || stakeOdds?.team1 !== null;
  const allowedBookmakers = ['pinnacle', 'unibet', 'polymarket', 'stake'];
  const hasBestBet = bestBet && bestBet.bookmaker && bestBet.bookmaker !== '' && bestBet.text && bestBet.text !== 'NO BET' && allowedBookmakers.includes(bestBet.bookmaker.toLowerCase());

  // Determine recommended side for each bookmaker
  const getRecoSide = (reco?: BetRecommendation): 'team1' | 'team2' | null => {
    if (!reco || reco.team === 'NO BET') return null;
    if (reco.team === 'TEAM1') return 'team1';
    if (reco.team === 'TEAM2') return 'team2';
    return null;
  };

  const pinnacleSide = getRecoSide(recoPinnacle);
  // For Unibet, use same logic as bestBet (check which team has EV+ based on probabilities)
  const unibetSide = unibetOdds ? (
    (unibetOdds.team1 && unibetOdds.team1 >= minOdds.team1) ? 'team1' :
    (unibetOdds.team2 && unibetOdds.team2 >= minOdds.team2) ? 'team2' : null
  ) : null;
  const polymarketSide = polymarketOdds ? (
    (polymarketOdds.team1 && polymarketOdds.team1 >= minOdds.team1) ? 'team1' :
    (polymarketOdds.team2 && polymarketOdds.team2 >= minOdds.team2) ? 'team2' : null
  ) : null;
  const stakeSide = stakeOdds ? (
    (stakeOdds.team1 && stakeOdds.team1 >= minOdds.team1) ? 'team1' :
    (stakeOdds.team2 && stakeOdds.team2 >= minOdds.team2) ? 'team2' : null
  ) : null;

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

        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
            <span className="text-[10px] sm:text-xs font-bold text-white/90 uppercase tracking-wider">
              ✨ {t('matchDetails.aiPrediction')}
            </span>
          </div>
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
                {Math.round(team1.winProbability)}%
              </span>
              <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2 mb-1">
                <div
                  className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${team1.winProbability}%` }}
                />
              </div>
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  EV ≥ {minOdds.team1.toFixed(2)}
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground/80">
                  +5%: {(minOdds.team1 * 1.05).toFixed(2)} · +10%: {(minOdds.team1 * 1.10).toFixed(2)}
                </span>
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
                {Math.round(team2.winProbability)}%
              </span>
              <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2 mb-1">
                <div
                  className="bg-accent h-1.5 sm:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${team2.winProbability}%` }}
                />
              </div>
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  EV ≥ {minOdds.team2.toFixed(2)}
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground/80">
                  +5%: {(minOdds.team2 * 1.05).toFixed(2)} · +10%: {(minOdds.team2 * 1.10).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bookmaker Odds Section */}
        {hasOdds && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('matchDetails.odds')}</span>
              <div className="flex gap-6 text-[10px] sm:text-xs text-muted-foreground">
                <span>{team1.name.substring(0, 8)}</span>
                <span>{team2.name.substring(0, 8)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <OddsCell label="Pinnacle" odds={pinnacleOdds} recommendedSide={pinnacleSide} />
              <OddsCell label="Unibet" odds={unibetOdds} recommendedSide={unibetSide} />
              <OddsCell label="Polymarket" odds={polymarketOdds} recommendedSide={polymarketSide} />
              <OddsCell label="Stake" odds={stakeOdds} recommendedSide={stakeSide} affiliateUrl="https://stake.com/?c=unYcYWyb" betLabel={t('matchDetails.betOn')} />
            </div>
          </div>
        )}

        {/* AI Recommendation */}
        {hasBestBet && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
            <div className="bg-gradient-to-r from-emerald-500/10 to-primary/10 border border-emerald-500/30 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {t('matchDetails.aiRecommendation')}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {bestBet!.text}
              </p>
              {bestBet!.ev && (
                <p className="text-[10px] sm:text-xs text-emerald-400/80 mt-0.5">
                  via <span className="capitalize">{bestBet!.bookmaker}</span> · EV: +{(bestBet!.ev * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-relaxed">
            {t('matchDetails.seriesWinProbability')} ({format})
          </p>
        </div>
      </div>
    </Card>
  );
};
