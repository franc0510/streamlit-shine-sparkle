import * as duckdb from "@duckdb/duckdb-wasm";
import { toLower } from "lodash";

export type TimeWindow = "last_10" | "last_20" | "last_365d";
export type ScaleMode = "none" | "minmax" | "zscore";

export interface PlayerStats {
  player: string;
  team: string;
  position?: string;
  [key: string]: number | string | undefined;
}

export interface TeamStats {
  team: string;
  players: PlayerStats[];
  aggregates: Record<string, number>;
  power_team?: number;
  power_league?: number;
}

let db: duckdb.AsyncDuckDB | null = null;

async function getDB() {
  if (db) return db;
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
  const worker = new Worker(bundle.mainWorker);
  db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  return db;
}

function normalizeName(s: string): string {
  return (
    s
      ?.toLowerCase()
      ?.normalize("NFD")
      ?.replace(/[\u0300-\u036f]/g, "")
      ?.replace(/[^a-z0-9]/g, " ")
      ?.replace(/\s+/g, " ")
      ?.trim() || ""
  );
}

function fuzzyMatch(target: string, list: string[]): string | null {
  const nTarget = normalizeName(target);
  let best: string | null = null;
  let bestScore = 0;
  for (const item of list) {
    const nItem = normalizeName(item);
    const dist = levenshtein(nTarget, nItem);
    const score = 1 - dist / Math.max(nTarget.length, nItem.length, 1);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore > 0.7 ? best : null;
}

// simple Levenshtein
function levenshtein(a: string, b: string): number {
  const dp = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function computeAggregates(players: PlayerStats[]): Record<string, number> {
  const numericKeys = Object.keys(players[0] || {}).filter((k) => typeof (players[0] as any)[k] === "number");
  const agg: Record<string, number> = {};
  for (const k of numericKeys) {
    const vals = players.map((p) => (typeof p[k] === "number" ? (p[k] as number) : NaN)).filter((x) => !isNaN(x));
    if (vals.length > 0) agg[k] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  return agg;
}

export async function parsePlayerDataParquet(
  team1Raw: string,
  team2Raw: string,
  scaleMode: ScaleMode = "none",
): Promise<[TeamStats, TeamStats] | null> {
  try {
    const db = await getDB();
    const conn = await db.connect();

    const res = await conn.query(`
      SELECT * FROM 'Documents/DF_filtered.parquet' LIMIT 1
    `);

    const columns = res.schema.fields.map((f) => f.name.toLowerCase());
    const teamCol = columns.find((c) => c.includes("team"));
    const playerCol = columns.find((c) => c.includes("player"));
    const roleCol = columns.find((c) => c.includes("role") || c.includes("position"));
    if (!teamCol || !playerCol) throw new Error("Colonnes team/player introuvables");

    const allTeamsRaw = (await conn.query(`SELECT DISTINCT "${teamCol}" AS team FROM 'Documents/DF_filtered.parquet'`))
      .toArray()
      .map((x: any) => x.team);

    const team1 = fuzzyMatch(team1Raw, allTeamsRaw) || team1Raw;
    const team2 = fuzzyMatch(team2Raw, allTeamsRaw) || team2Raw;

    const df = await conn.query(`
      SELECT * FROM 'Documents/DF_filtered.parquet'
      WHERE lower("${teamCol}") IN ('${team1.toLowerCase()}', '${team2.toLowerCase()}')
    `);

    const rows = df.toArray() as any[];
    if (!rows.length) throw new Error("Aucune ligne correspondante");

    const team1Players = rows.filter((r) => normalizeName(r[teamCol]) === normalizeName(team1));
    const team2Players = rows.filter((r) => normalizeName(r[teamCol]) === normalizeName(team2));

    const metrics = [
      "kda_last_10",
      "dpm_avg_last_365d",
      "wcpm_avg_last_365d",
      "vspm_avg_last_365d",
      "earned_gpm_avg_last_365d",
      "earned_gpm_avg_last_10",
    ];

    const clean = (r: any): PlayerStats => {
      const obj: PlayerStats = {
        player: r[playerCol],
        team: r[teamCol],
        position: roleCol ? r[roleCol] : undefined,
      };
      for (const m of metrics) if (m in r) obj[m] = r[m];
      return obj;
    };

    const t1 = team1Players.slice(0, 5).map(clean);
    const t2 = team2Players.slice(0, 5).map(clean);

    const t1Agg = computeAggregates(t1);
    const t2Agg = computeAggregates(t2);

    return [
      { team: team1, players: t1, aggregates: t1Agg },
      { team: team2, players: t2, aggregates: t2Agg },
    ];
  } catch (e) {
    console.error("parsePlayerDataParquet failed", e);
    return null;
  }
}
