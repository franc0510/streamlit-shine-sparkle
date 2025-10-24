import { parquetRead } from "hyparquet";

export type ScaleMode = "none" | "minmax" | "zscore";
export type TimeWindow = "last_10" | "last_20" | "last_365d";

export interface PlayerStats {
  player: string;
  position?: string;
  [key: string]: any;
}

export interface TeamStats {
  team: string;
  resolvedFrom?: string;
  players: PlayerStats[];
}

export interface TeamAggregates {
  kda_last_10?: number;
  kda_last_20?: number;
  earned_gpm_last_10?: number;
  earned_gpm_last_20?: number;
  earned_gpm_365d?: number;
  dpm_365d?: number;
  wcpm_365d?: number;
  vspm_365d?: number;
}

export function getPlayerImage(playerName: string): string {
  const safeName = playerName.replace(/\s+/g, "_");
  return `/Documents/players/${safeName}.jpg`;
}

const TEAM_ALIASES: Record<string, string[]> = {
  "100 thieves": ["100t", "100 thieves", "100thieves", "100"],
  "t1": ["t1", "skt", "sk telecom"],
  "gen.g": ["geng", "gen.g", "gen g", "gen.g esports", "geng esports"],
  "hanwha life esports": ["hle", "hanwha", "hanwha life", "hanwha life esports"],
  "nongshim redforce": ["ns", "nongshim", "redforce", "nongshim redforce"],
  "oksavingsbank brion": ["bro", "ok brion", "oksavingsbank", "oksavingsbank brion"],
  "dplus kia": ["dk", "dplus", "dpluskia", "dplus kia"],
  "dn freecs": ["kdf", "freecs", "dn freecs"],
  "bnk fearx": ["fearx", "bnk fearx"],
  "mad lions koi": ["mad", "koi", "mad lions koi"],
  "movistar koi": ["koi", "movistar koi"],
  "giantx": ["gx", "giant x", "giantx"],
  "team vitality": ["vit", "vitality", "team vitality"],
  "team heretics": ["heretics", "team heretics"],
  "karmine corp": ["kc", "kcorp", "karmine corp"],
  "top esports": ["topesports", "top esports", "tes"],
  "jd gaming": ["jdg", "jd gaming"],
  "bilibili gaming": ["blg", "bilibili gaming"],
  "funplus phoenix": ["fpx", "funplus phoenix"],
  "royal never give up": ["rng", "royal never give up"],
  "oh my god": ["omg", "oh my god"],
  "thundertalk gaming": ["tt", "thundertalk gaming"],
  "rare atom": ["ra", "rare atom"],
  "ninjas in pyjamas": ["nip", "ninjas in pyjamas"],
  "anyone's legend": ["al", "anyone's legend"],
  "team we": ["we", "team we"],
  "invictus gaming": ["ig", "invictus gaming"],
  "edward gaming": ["edg", "edward gaming"],
  "lgd gaming": ["lgd", "lgd gaming"],
  "cloud9": ["c9", "cloud9"],
  "team liquid": ["tl", "team liquid"],
  "flyquest": ["fly", "flyquest"],
  "pain gaming": ["pain", "pain gaming"],
  "red canids": ["red kalunga", "red canids"],
  "ctbc flying oyster": ["ctbc", "ctbc flying oyster"],
  "saigon dino": ["saigon dino"],
  "mgn vikings esports": ["mgn", "mgn vikings esports"],
  "team whales": ["team secret whales", "team whales"],
  "vivo keyd stars": ["vivo keyd stars"],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-_]/g, " ") // Convert dashes and underscores to spaces first
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveTeamName(input: string, allTeamsFromParquet: string[]): string {
  const norm = normalize(input);
  
  // 1) exact match
  const exact = allTeamsFromParquet.find((t) => normalize(t) === norm);
  if (exact) return exact;
  
  // 2) alias
  for (const [canonical, aliasList] of Object.entries(TEAM_ALIASES)) {
    if (aliasList.some((a) => normalize(a) === norm)) {
      const match = allTeamsFromParquet.find((t) => normalize(t) === normalize(canonical));
      if (match) return match;
    }
  }
  
  // 3) contains fallback
  const contains = allTeamsFromParquet.find((t) => normalize(t).includes(norm) || norm.includes(normalize(t)));
  if (contains) return contains;
  
  return input;
}

export async function parsePlayerDataParquet(
  teamA: string,
  teamB: string,
  scale: ScaleMode
): Promise<[TeamStats, TeamStats] | null> {
  const url = "/Documents/DF_filtered.parquet";
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch parquet: ${res.status}`);
    
    const buf = await res.arrayBuffer();
    const rows: any[] = [];
    
    await parquetRead({
      file: buf,
      onComplete: (data) => rows.push(...data),
    });
    
    console.log(`[parquetParser] Loaded ${rows.length} rows from parquet`);
    console.log("[parquetParser] Sample rows (first 3):", rows.slice(0, 3));
    
    // Detect columns
    const sample = rows[0] || {};
    const cols = Object.keys(sample);
    
    const teamCol = cols.find((c) => /^team/i.test(c)) || "team";
    const playerCol = cols.find((c) => /^player/i.test(c)) || "player";
    const posCol = cols.find((c) => /^position/i.test(c)) || "position";
    
    console.log(`[parquetParser] Detected columns -> team: ${teamCol}, player: ${playerCol}, position: ${posCol}`);
    
    // Extract all unique team names from parquet
    const allTeamsInParquet = Array.from(new Set(rows.map((r) => String(r[teamCol] || "")).filter(Boolean)));
    console.log(`[parquetParser] Found ${allTeamsInParquet.length} unique teams in parquet:`, allTeamsInParquet);
    
    // Resolve
    const resolvedA = resolveTeamName(teamA, allTeamsInParquet);
    const resolvedB = resolveTeamName(teamB, allTeamsInParquet);
    
    console.log(`[parquetParser] Team resolution: "${teamA}" -> "${resolvedA}", "${teamB}" -> "${resolvedB}"`);
    
    // Filter players
    const playersA = rows.filter((r) => normalize(String(r[teamCol] || "")) === normalize(resolvedA));
    const playersB = rows.filter((r) => normalize(String(r[teamCol] || "")) === normalize(resolvedB));
    
    console.log(`[parquetParser] Found ${playersA.length} players for team A, ${playersB.length} for team B`);
    
    const buildTeam = (teamName: string, players: any[], resolvedFrom: string): TeamStats => ({
      team: teamName,
      resolvedFrom,
      players: players.map((r) => ({
        player: String(r[playerCol] || "Unknown"),
        position: String(r[posCol] || ""),
        ...r,
      })),
    });
    
    return [
      buildTeam(teamA, playersA, resolvedA),
      buildTeam(teamB, playersB, resolvedB),
    ];
  } catch (err: any) {
    console.error("[parquetParser] Error:", err);
    throw err;
  }
}
