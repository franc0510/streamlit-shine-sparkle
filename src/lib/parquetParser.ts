import { parquetRead } from 'hyparquet';

export interface PlayerStats {
  player_name: string;
  team: string;
  position: string;
  // Last 10 games
  kda_last_10?: number;
  earned_gpm_avg_last_10?: number;
  // Last 20 games
  kda_last_20?: number;
  earned_gpm_avg_last_20?: number;
  // Last 365 days
  dpm_avg_last_365d?: number;
  wcpm_avg_last_365d?: number;
  vspm_avg_last_365d?: number;
  earned_gpm_avg_last_365d?: number;
}

export interface TeamAggregates {
  kda_last_10?: number;
  earned_gpm_last_10?: number;
  kda_last_20?: number;
  earned_gpm_last_20?: number;
  dpm_365d?: number;
  wcpm_365d?: number;
  vspm_365d?: number;
  earned_gpm_365d?: number;
}

export interface TeamStats {
  team: string;
  power_team?: number;
  power_league?: number;
  players: PlayerStats[];
  aggregates: TeamAggregates;
}

export type TimeWindow = 'last_10' | 'last_20' | 'last_365d';
export type ScaleMode = 'none' | 'minmax' | 'zscore';

const positionOrder: Record<string, number> = {
  'top': 1,
  'jungle': 2,
  'mid': 3,
  'bot': 4,
  'support': 5,
};

// Helper to calculate team aggregates
const calculateTeamAggregates = (players: PlayerStats[]): TeamAggregates => {
  const avg = (values: (number | undefined)[]) => {
    const valid = values.filter(v => v != null && !isNaN(v)) as number[];
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : undefined;
  };

  return {
    kda_last_10: avg(players.map(p => p.kda_last_10)),
    earned_gpm_last_10: avg(players.map(p => p.earned_gpm_avg_last_10)),
    kda_last_20: avg(players.map(p => p.kda_last_20)),
    earned_gpm_last_20: avg(players.map(p => p.earned_gpm_avg_last_20)),
    dpm_365d: avg(players.map(p => p.dpm_avg_last_365d)),
    wcpm_365d: avg(players.map(p => p.wcpm_avg_last_365d)),
    vspm_365d: avg(players.map(p => p.vspm_avg_last_365d)),
    earned_gpm_365d: avg(players.map(p => p.earned_gpm_avg_last_365d)),
  };
};

export const parsePlayerDataParquet = async (team1Name: string, team2Name: string): Promise<[TeamStats, TeamStats] | null> => {
  try {
    const response = await fetch('/Documents/DF_filtered.parquet');
    const arrayBuffer = await response.arrayBuffer();
    
    const team1Players: PlayerStats[] = [];
    const team2Players: PlayerStats[] = [];
    let team1Power = { power_team: 0, power_league: 0 };
    let team2Power = { power_team: 0, power_league: 0 };

    // Create AsyncBuffer wrapper
    const asyncBuffer = {
      byteLength: arrayBuffer.byteLength,
      slice: (start: number, end: number) => Promise.resolve(arrayBuffer.slice(start, end))
    };

    await parquetRead({
      file: asyncBuffer,
      onComplete: (data: any[]) => {
        for (const row of data) {
          // Resilient column mapping
          const teamName = row.team || row.teamname || '';
          const playerName = row.player_name || row.player || '';
          const position = (row.position || '').toLowerCase();

          if (teamName.toLowerCase().includes(team1Name.toLowerCase()) || 
              team1Name.toLowerCase().includes(teamName.toLowerCase())) {
            if (!team1Power.power_team && row.power_team != null) {
              team1Power.power_team = row.power_team;
            }
            if (!team1Power.power_league && row.power_league != null) {
              team1Power.power_league = row.power_league;
            }
            if (playerName) {
              team1Players.push({
                player_name: playerName,
                team: teamName,
                position: position,
                kda_last_10: row.kda_last_10,
                earned_gpm_avg_last_10: row.earned_gpm_avg_last_10,
                kda_last_20: row.kda_last_20,
                earned_gpm_avg_last_20: row.earned_gpm_avg_last_20,
                dpm_avg_last_365d: row.dpm_avg_last_365d,
                wcpm_avg_last_365d: row.wcpm_avg_last_365d,
                vspm_avg_last_365d: row.vspm_avg_last_365d,
                earned_gpm_avg_last_365d: row.earned_gpm_avg_last_365d,
              });
            }
          } else if (teamName.toLowerCase().includes(team2Name.toLowerCase()) || 
                     team2Name.toLowerCase().includes(teamName.toLowerCase())) {
            if (!team2Power.power_team && row.power_team != null) {
              team2Power.power_team = row.power_team;
            }
            if (!team2Power.power_league && row.power_league != null) {
              team2Power.power_league = row.power_league;
            }
            if (playerName) {
              team2Players.push({
                player_name: playerName,
                team: teamName,
                position: position,
                kda_last_10: row.kda_last_10,
                earned_gpm_avg_last_10: row.earned_gpm_avg_last_10,
                kda_last_20: row.kda_last_20,
                earned_gpm_avg_last_20: row.earned_gpm_avg_last_20,
                dpm_avg_last_365d: row.dpm_avg_last_365d,
                wcpm_avg_last_365d: row.wcpm_avg_last_365d,
                vspm_avg_last_365d: row.vspm_avg_last_365d,
                earned_gpm_avg_last_365d: row.earned_gpm_avg_last_365d,
              });
            }
          }
        }
      }
    });

    // Sort players by position
    const sortPlayers = (players: PlayerStats[]) => 
      players.sort((a, b) => (positionOrder[a.position] || 99) - (positionOrder[b.position] || 99));

    const sortedTeam1Players = sortPlayers(team1Players);
    const sortedTeam2Players = sortPlayers(team2Players);

    return [
      { 
        team: team1Name, 
        power_team: team1Power.power_team, 
        power_league: team1Power.power_league, 
        players: sortedTeam1Players,
        aggregates: calculateTeamAggregates(sortedTeam1Players)
      },
      { 
        team: team2Name, 
        power_team: team2Power.power_team, 
        power_league: team2Power.power_league, 
        players: sortedTeam2Players,
        aggregates: calculateTeamAggregates(sortedTeam2Players)
      }
    ];
  } catch (error) {
    console.error('Error parsing parquet file:', error);
    return null;
  }
};

export const getPlayerImage = (playerName: string): string => {
  const normalized = playerName.replace(/\s+/g, ' ').trim();
  return `/Documents/players/${normalized}.jpg`;
};
