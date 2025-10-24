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

// Team name aliases for better matching
const TEAM_ALIASES: Record<string, string[]> = {
  // LCK
  'gen.g': ['gen g esports', 'gen.g', 'geng', 'gen', 'gen g'],
  't1': ['t1', 't1 esports', 'skt', 'skt t1'],
  'hanwha life esports': ['hle', 'hanwha', 'hanwha life esports', 'hanwha life'],
  'nongshim redforce': ['ns', 'nongshim', 'redforce', 'nongshim redforce'],
  'oksavingsbank brion': ['bro', 'ok brion', 'oksavingsbank', 'oksavingsbank brion', 'brion'],
  'dplus kia': ['dk', 'dplus', 'dpluskia', 'dplus kia'],
  'dn freecs': ['kdf', 'freecs', 'dn freecs'],
  'bnk fearx': ['fearx', 'bnk fearx'],
  'kt rolster': ['kt', 'kt rolster'],
  // LEC
  'mad lions koi': ['mad', 'mad lions koi', 'mad lions'],
  'movistar koi': ['koi', 'movistar koi'],
  'giantx': ['gx', 'giant x', 'giantx'],
  'team vitality': ['vit', 'vitality', 'team vitality'],
  'team heretics': ['heretics', 'team heretics'],
  'karmine corp': ['kc', 'kcorp', 'karmine corp'],
  'fnatic': ['fnatic', 'fnc'],
  'g2 esports': ['g2', 'g2 esports'],
  'rogue': ['rogue'],
  'sk gaming': ['sk', 'sk gaming'],
  // LPL
  'top esports': ['topesports', 'top', 'tes', 'top esports'],
  'jd gaming': ['jdg', 'jd gaming'],
  'bilibili gaming': ['blg', 'bilibili', 'bilibili gaming'],
  'funplus phoenix': ['fpx', 'funplus phoenix'],
  'royal never give up': ['rng', 'royal never give up'],
  'oh my god': ['omg', 'oh my god'],
  'thundertalk gaming': ['tt', 'thundertalk gaming'],
  'rare atom': ['ra', 'rare atom'],
  'ninjas in pyjamas': ['nip', 'ninjas in pyjamas'],
  "anyone's legend": ['al', "anyone's legend", 'anyones legend'],
  'team we': ['we', 'team we'],
  'invictus gaming': ['ig', 'invictus gaming'],
  'edward gaming': ['edg', 'edward gaming'],
  'lgd gaming': ['lgd', 'lgd gaming'],
  'lng esports': ['lng', 'lng esports'],
  'weibo gaming': ['wbg', 'weibo', 'weibo gaming'],
  // LCS / Americas
  'cloud9': ['c9', 'cloud9'],
  'team liquid': ['tl', 'team liquid', 'liquid'],
  '100 thieves': ['100t', '100 thieves', '100thieves', '100'],
  'flyquest': ['fly', 'flyquest', 'fly quest'],
  'pain gaming': ['pain', 'pain gaming'],
  'red canids': ['red kalunga', 'red canids', 'red'],
  'loud': ['loud'],
  'nrg': ['nrg'],
  'immortals': ['imt', 'immortals'],
  'dignitas': ['dig', 'dignitas'],
  // LCP / Other regions
  'ctbc flying oyster': ['ctbc', 'ctbc flying oyster', 'flying oyster'],
  'saigon dino': ['saigon dino'],
  'mgn vikings esports': ['mgn', 'mgn vikings esports', 'vikings'],
  'team whales': ['team secret whales', 'team whales', 'whales'],
  'vivo keyd stars': ['vivo keyd', 'vivo keyd stars', 'keyd'],
  'psg talon': ['psg', 'psg talon', 'talon'],
};

const positionOrder: Record<string, number> = {
  'top': 1,
  'jungle': 2,
  'mid': 3,
  'bot': 4,
  'support': 5,
};

// Normalize team name for matching
const normalizeTeamName = (name: string): string => {
  return name.toLowerCase()
    .trim()
    .replace(/[.\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Check if two team names match (considering aliases)
const teamsMatch = (name1: string, name2: string): boolean => {
  const norm1 = normalizeTeamName(name1);
  const norm2 = normalizeTeamName(name2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // Check if one contains the other (for partial matches like "100 Thieves" vs "100T")
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Check aliases
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    const matchesCanonical1 = canonical === norm1 || aliases.some(a => a === norm1);
    const matchesCanonical2 = canonical === norm2 || aliases.some(a => a === norm2);
    if (matchesCanonical1 && matchesCanonical2) return true;
  }
  
  return false;
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

// Normalisation helpers
const normalizeMinMax = (values: (number | undefined)[]): (number | undefined)[] => {
  const validValues = values.filter(v => v != null && !isNaN(v)) as number[];
  if (validValues.length === 0) return values;
  
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const range = max - min;
  
  if (range === 0) return values.map(v => v != null ? 0.5 : v);
  
  return values.map(v => v != null && !isNaN(v) ? (v - min) / range : v);
};

const normalizeZScore = (values: (number | undefined)[]): (number | undefined)[] => {
  const validValues = values.filter(v => v != null && !isNaN(v)) as number[];
  if (validValues.length === 0) return values;
  
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const variance = validValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validValues.length;
  const std = Math.sqrt(variance);
  
  if (std === 0) return values.map(v => v != null ? 0.5 : v);
  
  // Z-score puis sigmoïde pour ramener dans [0,1]
  return values.map(v => {
    if (v == null || isNaN(v)) return v;
    const z = (v - mean) / std;
    return 1 / (1 + Math.exp(-z));
  });
};

export const parsePlayerDataParquet = async (team1Name: string, team2Name: string, scaleMode: ScaleMode = 'none'): Promise<[TeamStats, TeamStats] | null> => {
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
        console.log('Parquet rows loaded:', data.length);
        let logCount = 0;
        for (const row of data) {
          // Resilient column mapping
          const teamName = row.team || row.teamname || row.teamName || '';
          const playerName = row.player_name || row.player || row.playerName || '';
          const position = (row.position || '').toLowerCase();

          if (logCount < 3) {
            console.log('Row sample:', { teamName, playerName, position });
            logCount++;
          }

          if (teamsMatch(teamName, team1Name)) {
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
                kda_last_10: row.kda_last_10 ?? row.kda_avg_last_10,
                earned_gpm_avg_last_10: row.earned_gpm_avg_last_10 ?? row.earnedgpm_avg_last_10,
                kda_last_20: row.kda_last_20 ?? row.kda_avg_last_20,
                earned_gpm_avg_last_20: row.earned_gpm_avg_last_20 ?? row.earnedgpm_avg_last_20,
                dpm_avg_last_365d: row.dpm_avg_last_365d ?? row.dpm_365d,
                wcpm_avg_last_365d: row.wcpm_avg_last_365d ?? row.wcpm_365d,
                vspm_avg_last_365d: row.vspm_avg_last_365d ?? row.vspm_365d,
                earned_gpm_avg_last_365d: row.earned_gpm_avg_last_365d ?? row.earnedgpm_avg_last_365d,
              });
            }
          } else if (teamsMatch(teamName, team2Name)) {
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
                kda_last_10: row.kda_last_10 ?? row.kda_avg_last_10,
                earned_gpm_avg_last_10: row.earned_gpm_avg_last_10 ?? row.earnedgpm_avg_last_10,
                kda_last_20: row.kda_last_20 ?? row.kda_avg_last_20,
                earned_gpm_avg_last_20: row.earned_gpm_avg_last_20 ?? row.earnedgpm_avg_last_20,
                dpm_avg_last_365d: row.dpm_avg_last_365d ?? row.dpm_365d,
                wcpm_avg_last_365d: row.wcpm_avg_last_365d ?? row.wcpm_365d,
                vspm_avg_last_365d: row.vspm_avg_last_365d ?? row.vspm_365d,
                earned_gpm_avg_last_365d: row.earned_gpm_avg_last_365d ?? row.earnedgpm_avg_last_365d,
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
    const allPlayers = [...sortedTeam1Players, ...sortedTeam2Players];

    console.log('Team match:', { team1Name, team2Name, team1Count: sortedTeam1Players.length, team2Count: sortedTeam2Players.length });

    // Apply normalization across all 10 players if requested
    if (scaleMode !== 'none' && allPlayers.length > 0) {
      const metrics: Array<keyof PlayerStats> = [
        'kda_last_10', 'kda_last_20',
        'dpm_avg_last_365d', 'wcpm_avg_last_365d', 'vspm_avg_last_365d',
        'earned_gpm_avg_last_365d', 'earned_gpm_avg_last_10', 'earned_gpm_avg_last_20'
      ];

      metrics.forEach(metric => {
        const values = allPlayers.map(p => p[metric] as number | undefined);
        const normalized = scaleMode === 'minmax' 
          ? normalizeMinMax(values)
          : normalizeZScore(values);
        
        allPlayers.forEach((player, idx) => {
          if (normalized[idx] != null) {
            (player as any)[metric] = normalized[idx];
          }
        });
      });
    }

    return [
      { 
        team: team1Name, 
        power_team: team1Power.power_team, 
        power_league: team1Power.power_league, 
        players: allPlayers.slice(0, sortedTeam1Players.length),
        aggregates: calculateTeamAggregates(allPlayers.slice(0, sortedTeam1Players.length))
      },
      { 
        team: team2Name, 
        power_team: team2Power.power_team, 
        power_league: team2Power.power_league, 
        players: allPlayers.slice(sortedTeam1Players.length),
        aggregates: calculateTeamAggregates(allPlayers.slice(sortedTeam1Players.length))
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
