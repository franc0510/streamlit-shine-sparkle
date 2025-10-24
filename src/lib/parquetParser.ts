/* eslint-disable @typescript-eslint/no-explicit-any */
import * as duckdb from "@duckdb/duckdb-wasm";

export type TimeWindow = "last_10" | "last_20" | "last_365d";
export type ScaleMode = "none" | "minmax" | "zscore";

export type PlayerStats = {
  team: string;
  teamname?: string;
  player: string;
  player_name?: string;
  position?: string;
  [k: string]: number | string | undefined;
};

export type TeamStats = {
  team: string;
  players: PlayerStats[];
  aggregates: Record<string, number>;
  resolvedFrom: string;
};

export type ParseResult = [TeamStats, TeamStats];

const PARQUET_URL = "/Documents/DF_filtered.parquet"; // ⚠️ le fichier doit être servi statiquement (ex: dans /public/Documents/)

const TEAM_ALIASES: Record<string, string> = {
  "GEN G": "Gen.G",
  "GEN.G": "Gen.G",
  GENG: "Gen.G",
  HLE: "Hanwha Life Esports",
  NS: "Nongshim RedForce",
  BRO: "OKSavingsBank BRION",
  DK: "Dplus KIA",
  KDF: "DN Freecs",
  FEARX: "BNK FEARX",
  MAD: "MAD Lions KOI",
  GX: "GiantX",
  "GIANT X": "GiantX",
  VIT: "Team Vitality",
  HERETICS: "Team Heretics",
  KC: "Karmine Corp",
  TES: "Top Esports",
  TOPESPORTS: "Top Esports",
  JDG: "JD Gaming",
  BLG: "Bilibili Gaming",
  "BILIBILI GAMING DREAMSMART": "Bilibili Gaming",
  C9: "Cloud9",
  TL: "Team Liquid",
  "100T": "100 Thieves",
  FLY: "FlyQuest",
  "CTBC FLYING OYSTER": "CTBC Flying Oyster",
  "TEAM SECRET WHALES": "Team Whales",
  "ANYONE'S LEGEND": "Anyone's Legend",
  "VIVO KEYD STARS": "Vivo Keyd Stars",
  T1: "T1",
};

function stripAccents(s: string) {
  return s.normalize("NFKD").replace(/\p{Diacritic}/gu, "");
}
function normKey(s: string) {
  return stripAccents(String(s || ""))
    .toUpperCase()
    .replace(/[.'’\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function applyAlias(s: string) {
  const k = normKey(s);
  return TEAM_ALIASES[k] ?? s;
}

/* ---------------- duckdb-wasm init ---------------- */

let _db: duckdb.AsyncDuckDB | null = null;

async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (_db) return _db;

  const DUCKDB_BUNDLES = duckdb.getJsDelivrBundles(); // pratique: bundle auto CDN
  const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);

  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  // Autoriser l’accès HTTP(s) au parquet
  await db.open({ backend: "httpfs" });
  const conn = await db.connect();
  await conn.query("INSTALL httpfs; LOAD httpfs;");
  await conn.close();

  _db = db;
  return db;
}

/* --------------- lecture & introspection --------------- */

async function fetchAllTeams(conn: duckdb.AsyncDuckDBConnection, table: string, teamCol: string) {
  const rs = await conn.query(`SELECT DISTINCT ${teamCol} as team FROM ${table} WHERE ${teamCol} IS NOT NULL`);
  return rs
    .toArray()
    .map((r: any) => String(r.team).trim())
    .filter(Boolean);
}

async function detectTeamCol(conn: duckdb.AsyncDuckDBConnection, table: string): Promise<string> {
  const cols = await conn.query(`PRAGMA table_info('${table}')`);
  const names = cols.toArray().map((r: any) => String(r.name).toLowerCase());
  const orig = cols.toArray().map((r: any) => String(r.name));

  const want = ["teamname", "team_name", "team"];
  for (const w of want) {
    const idx = names.indexOf(w);
    if (idx >= 0) return orig[idx];
  }
  // fallback: 1ère colonne qui contient "team"
  const idx2 = names.findIndex((n: string) => n.includes("team"));
  if (idx2 >= 0) return orig[idx2];
  return orig[0];
}

function resolveTeam(wanted: string, candidates: string[]): { found?: string; why: string } {
  const wantAliased = applyAlias(wanted);
  const key = normKey(wantAliased);

  const index = new Map<string, string>();
  for (const c of candidates) {
    index.set(normKey(applyAlias(c)), c);
  }

  if (index.has(key)) return { found: index.get(key), why: "equal(norm+alias)" };

  for (const [k, v] of index.entries()) {
    if (k.includes(key) || key.includes(k)) return { found: v, why: "contains" };
  }
  const s = key.replace(/\s+/g, "");
  for (const [k, v] of index.entries()) {
    if (k.replace(/\s+/g, "") === s) return { found: v, why: "stripSpacesEqual" };
  }
  return { why: "not_found" };
}

function aggregatesFrom(players: PlayerStats[]): Record<string, number> {
  const keys = [
    "kda_last_10",
    "kda_last_20",
    "earned_gpm_avg_last_10",
    "earned_gpm_avg_last_365d",
    "dpm_avg_last_365d",
    "wcpm_avg_last_365d",
    "vspm_avg_last_365d",
  ] as const;

  const out: Record<string, number> = {};
  for (const k of keys) {
    const vals = players.map((p) => Number(p[k] as number)).filter((x) => Number.isFinite(x));
    out[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }
  return out;
}

/* -------------- mapping colonnes KPI (souple) -------------- */

const KPI_MAP: Record<string, string[]> = {
  kda_last_10: ["kda_last_10", "kda10"],
  kda_last_20: ["kda_last_20", "kda20"],
  earned_gpm_avg_last_10: ["earned_gpm_avg_last_10", "egpm10"],
  earned_gpm_avg_last_365d: ["earned_gpm_avg_last_365d", "egpm365"],
  dpm_avg_last_365d: ["dpm_avg_last_365d", "dpm365"],
  wcpm_avg_last_365d: ["wcpm_avg_last_365d", "wcpm365"],
  vspm_avg_last_365d: ["vspm_avg_last_365d", "vspm365"],
};

function pickColName(existing: string[], candidates: string[]): string | null {
  const low = existing.map((c) => c.toLowerCase());
  for (const c of candidates) {
    const i = low.indexOf(c.toLowerCase());
    if (i >= 0) return existing[i];
  }
  return null;
}

/* ========================= API PRINCIPALE ========================= */

export async function parsePlayerDataParquet(
  team1: string,
  team2: string,
  _scale: ScaleMode = "none",
): Promise<[TeamStats, TeamStats] | null> {
  const db = await getDB();
  const conn = await db.connect();

  try {
    // on lit le parquet en table volatile
    await conn.query(`CREATE OR REPLACE TEMP TABLE t AS SELECT * FROM read_parquet('${PARQUET_URL}')`);

    // colonnes clés
    const teamCol = await detectTeamCol(conn, "t");

    // toutes les équipes présentes (pour debug & matching)
    const allTeams = await fetchAllTeams(conn, "t", teamCol);

    const r1 = resolveTeam(team1, allTeams);
    const r2 = resolveTeam(team2, allTeams);
    if (!r1.found || !r2.found) {
      // aide au debug : retourne les 60 premières équipes
      const sample = allTeams.slice(0, 60).join(", ");
      throw new Error(
        `Team resolution failed: (${team1} → ${r1.why}) / (${team2} → ${r2.why}). ` +
          `Sample teams in parquet: ${sample}`,
      );
    }

    // colonnes existantes
    const info = await conn.query(`PRAGMA table_info('t')`);
    const cols = info.toArray().map((r: any) => String(r.name));

    const playerCol =
      pickColName(cols, ["player", "player_name", "playername", "name"]) ||
      cols.find((c) => c.toLowerCase().includes("player")) ||
      "player";
    const posCol = pickColName(cols, ["position", "role", "pos"]);

    // map KPI réels
    const kpiCols: Record<string, string> = {};
    for (const [key, candidates] of Object.entries(KPI_MAP)) {
      const hit = pickColName(cols, candidates);
      if (hit) kpiCols[key] = hit;
    }

    const selectCols = [
      `${JSON.stringify(teamCol)} as team_col`,
      `${JSON.stringify(playerCol)} as player_col`,
      posCol ? `${JSON.stringify(posCol)} as pos_col` : null,
      ...Object.values(kpiCols).map((c) => `${JSON.stringify(c)} as "${c}"`),
    ].filter(Boolean) as string[];

    // ⚠️ IMPORTANT: on passe les valeurs résolues telles quelles
    const q1 = `
      SELECT ${selectCols.join(", ")}
      FROM t
      WHERE ${duckdb.escapeIdentifier(teamCol)} = ${duckdb.escapeLiteral(r1.found!)}
    `;
    const q2 = `
      SELECT ${selectCols.join(", ")}
      FROM t
      WHERE ${duckdb.escapeIdentifier(teamCol)} = ${duckdb.escapeLiteral(r2.found!)}
    `;

    const rs1 = await conn.query(q1);
    const rs2 = await conn.query(q2);

    const rows1 = rs1.toArray();
    const rows2 = rs2.toArray();

    function toPlayers(rows: any[], team: string): PlayerStats[] {
      const players = rows.map((r) => {
        const p: PlayerStats = {
          team,
          teamname: team,
          player: String(r.player_col ?? "").trim(),
          position: posCol ? String(r.pos_col ?? "") : undefined,
        };
        // recopie des KPI si présents
        for (const [apiKey, realCol] of Object.entries(kpiCols)) {
          const v = Number(r[realCol as keyof typeof r]);
          if (Number.isFinite(v)) (p as any)[apiKey] = v;
        }
        return p;
      });

      const roleOrder = (s?: string) => {
        const u = String(s || "").toUpperCase();
        if (u.includes("TOP")) return 1;
        if (u.includes("JGL") || u.includes("JUNG")) return 2;
        if (u.includes("MID")) return 3;
        if (u.includes("ADC") || u.includes("BOT")) return 4;
        if (u.includes("SUP")) return 5;
        return 99;
      };

      players.sort((a, b) => {
        const ra = roleOrder(a.position);
        const rb = roleOrder(b.position);
        if (ra !== rb) return ra - rb;
        const ea = (a["earned_gpm_avg_last_10"] as number) ?? -1e9;
        const eb = (b["earned_gpm_avg_last_10"] as number) ?? -1e9;
        return eb - ea;
      });

      return players.slice(0, 5);
    }

    const players1 = toPlayers(rows1, r1.found!);
    const players2 = toPlayers(rows2, r2.found!);

    const teamA: TeamStats = {
      team: r1.found!,
      players: players1,
      aggregates: aggregatesFrom(players1),
      resolvedFrom: r1.found!,
    };
    const teamB: TeamStats = {
      team: r2.found!,
      players: players2,
      aggregates: aggregatesFrom(players2),
      resolvedFrom: r2.found!,
    };

    return [teamA, teamB];
  } finally {
    await conn.close();
  }
}
