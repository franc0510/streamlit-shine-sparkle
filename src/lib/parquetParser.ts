import { tableFromIPC } from 'apache-arrow';

export interface PlayerStats {
  player_name: string;
  team: string;
  position: string;
  kda_last_10?: number;
  dpm_avg_last_365d?: number;
  wcpm_avg_last_365d?: number;
  vspm_avg_last_365d?: number;
  earned_gpm_avg_last_365d?: number;
  earned_gpm_avg_last_10?: number;
}

export interface TeamStats {
  team: string;
  power_team?: number;
  power_league?: number;
  players: PlayerStats[];
}

const positionOrder: Record<string, number> = {
  'top': 1,
  'jungle': 2,
  'mid': 3,
  'bot': 4,
  'support': 5,
};

export const parsePlayerDataParquet = async (team1Name: string, team2Name: string): Promise<[TeamStats, TeamStats] | null> => {
  try {
    const response = await fetch('/Documents/DF_filtered.parquet');
    const arrayBuffer = await response.arrayBuffer();
    const table = tableFromIPC(new Uint8Array(arrayBuffer));
    
    const rows = table.toArray();
    
    const team1Players: PlayerStats[] = [];
    const team2Players: PlayerStats[] = [];
    let team1Power = { power_team: 0, power_league: 0 };
    let team2Power = { power_team: 0, power_league: 0 };

    for (const row of rows) {
      const rowObj: any = {};
      table.schema.fields.forEach((field, idx) => {
        rowObj[field.name] = row[idx];
      });

      const teamName = rowObj.team || '';
      const playerName = rowObj.player_name || rowObj.player || '';
      const position = (rowObj.position || '').toLowerCase();

      if (teamName.toLowerCase().includes(team1Name.toLowerCase()) || 
          team1Name.toLowerCase().includes(teamName.toLowerCase())) {
        if (!team1Power.power_team && rowObj.power_team != null) {
          team1Power.power_team = rowObj.power_team;
        }
        if (!team1Power.power_league && rowObj.power_league != null) {
          team1Power.power_league = rowObj.power_league;
        }
        if (playerName) {
          team1Players.push({
            player_name: playerName,
            team: teamName,
            position: position,
            kda_last_10: rowObj.kda_last_10,
            dpm_avg_last_365d: rowObj.dpm_avg_last_365d,
            wcpm_avg_last_365d: rowObj.wcpm_avg_last_365d,
            vspm_avg_last_365d: rowObj.vspm_avg_last_365d,
            earned_gpm_avg_last_365d: rowObj.earned_gpm_avg_last_365d,
            earned_gpm_avg_last_10: rowObj.earned_gpm_avg_last_10,
          });
        }
      } else if (teamName.toLowerCase().includes(team2Name.toLowerCase()) || 
                 team2Name.toLowerCase().includes(teamName.toLowerCase())) {
        if (!team2Power.power_team && rowObj.power_team != null) {
          team2Power.power_team = rowObj.power_team;
        }
        if (!team2Power.power_league && rowObj.power_league != null) {
          team2Power.power_league = rowObj.power_league;
        }
        if (playerName) {
          team2Players.push({
            player_name: playerName,
            team: teamName,
            position: position,
            kda_last_10: rowObj.kda_last_10,
            dpm_avg_last_365d: rowObj.dpm_avg_last_365d,
            wcpm_avg_last_365d: rowObj.wcpm_avg_last_365d,
            vspm_avg_last_365d: rowObj.vspm_avg_last_365d,
            earned_gpm_avg_last_365d: rowObj.earned_gpm_avg_last_365d,
            earned_gpm_avg_last_10: rowObj.earned_gpm_avg_last_10,
          });
        }
      }
    }

    // Sort players by position
    const sortPlayers = (players: PlayerStats[]) => 
      players.sort((a, b) => (positionOrder[a.position] || 99) - (positionOrder[b.position] || 99));

    return [
      { team: team1Name, power_team: team1Power.power_team, power_league: team1Power.power_league, players: sortPlayers(team1Players) },
      { team: team2Name, power_team: team2Power.power_team, power_league: team2Power.power_league, players: sortPlayers(team2Players) }
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
