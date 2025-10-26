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
  // KPIs
  kda_last_10?: number;
  kda_last_20?: number;
  earned_gpm_avg_last_10?: number;
  earned_gpm_avg_last_365d?: number;
  dpm_avg_last_365d?: number;
  wcpm_avg_last_365d?: number;
  vspm_avg_last_365d?: number;
};

export type TeamAggregates = Record<string, number>;
export type TeamStats = {
  team: string;
  players: PlayerStats[];
  aggregates: TeamAggregates;
  resolvedFrom: string;
};
export type ParseResult = [TeamStats, TeamStats];

/* ============================================================================
   Helpers URL : construit une URL absolue depuis l'origine (respecte BASE_URL)
   Place le fichier dans: public/Documents/DF_filtered.parquet
   ============================================================================ */
function assetUrl(relPath: string): string {
  const rel = relPath.replace(/^\/+/, "");
  const baseTagHref = document.querySelector("base")?.getAttribute("href") || "";
  const baseFromTag = baseTagHref ? new URL(baseTagHref, window.location.origin).pathname : "";
  // @ts-ignore (Vite)
  const baseFromVite: string = (import.meta as any)?.env?.BASE_URL || "";
  const base = (baseFromTag || baseFromVite || "/").toString();
  const normBase = (base.startsWith("/") ? base : "/" + base).replace(/\/+$/, "");
  return new URL(`${normBase}/${rel}`, window.location.origin).toString();
}

/** URL publique du parquet (servi par l’app). */
const PARQUET_URL = assetUrl("Documents/DF_filtered.parquet");

/* ============================================================================
   Aliases équipes
   ============================================================================ */
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

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/* ============================================================================
   duckdb-wasm init
   ============================================================================ */
let _db: duckdb.AsyncDuckDB | null = null;

async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (_db) return _db;

  const DUCKDB_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);

  // worker (blob:) pour éviter CORS
  const workerUrl = new URL(bundle.mainWorker!);
  const response = await fetch(workerUrl);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const worker = new Worker(blobUrl, { type: "module" });
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  await db.open({});

  const conn = await db.connect();
  await conn.query("INSTALL httpfs; LOAD httpfs;");
  await conn.close();

  _db = db;
  return db;
}

/* ============================================================================
   lecture & introspection
   ============================================================================ */
async function fetchAllTeams(conn: duckdb.AsyncDuckDBConnection, table: string, teamCol: string) {
  const escapedCol = `"${teamCol.replace(/"/g, '""')}"`;
  const rs = await conn.query(`SELECT DISTINCT ${escapedCol} as team FROM ${table} WHERE ${escapedCol} IS NOT NULL`);
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

function aggregatesFrom(players: PlayerStats[]): TeamAggregates {
  const keys = [
    "kda_last_10",
    "kda_last_20",
    "earned_gpm_avg_last_10",
    "earned_gpm_avg_last_365d",
    "dpm_avg_last_365d",
    "wcpm_avg_last_365d",
    "vspm_avg_last_365d",
  ] as const;

  const out: TeamAggregates = {};
  for (const k of keys) {
    const vals = players.map((p) => toNum((p as any)[k])).filter((x): x is number => typeof x === "number");
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

/* ============ images joueurs (asset servi depuis public/) ============ */
export function getPlayerImage(playerName: string): string {
  const clean = String(playerName || "").trim();
  return assetUrl(`Documents/teams/${clean}.png`);
}

/* ============================================================================
   API principale
   ============================================================================ */
export async function parsePlayerDataParquet(
  team1: string,
  team2: string,
  _scale: ScaleMode = "none",
): Promise<[TeamStats, TeamStats] | null> {
  const db = await getDB();
  const conn = await db.connect();

  try {
    await conn.query(`CREATE OR REPLACE TEMP TABLE t AS SELECT * FROM read_parquet('${PARQUET_URL}')`);

    const teamCol = await detectTeamCol(conn, "t");
    const allTeams = await fetchAllTeams(conn, "t", teamCol);

    const r1 = resolveTeam(team1, allTeams);
    const r2 = resolveTeam(team2, allTeams);
    if (!r1.found || !r2.found) {
      const sample = allTeams.slice(0, 60).join(", ");
      throw new Error(
        `Team resolution failed: (${team1} → ${r1.why}) / (${team2} → ${r2.why}). ` +
          `Sample teams in parquet: ${sample}`,
      );
    }

    const info = await conn.query(`PRAGMA table_info('t')`);
    const cols = info.toArray().map((r: any) => String(r.name));

    const playerCol =
      pickColName(cols, ["player", "player_name", "playername", "name"]) ||
      cols.find((c) => c.toLowerCase().includes("player")) ||
      "player";
    const posCol = pickColName(cols, ["position", "role", "pos"]);

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

    // Simple SQL escaping
    const escapeSql = (val: string) => val.replace(/'/g, "''");

    const q1 = `
      SELECT ${selectCols.join(", ")}
      FROM t
      WHERE "${teamCol}" = '${escapeSql(r1.found!)}'
    `;
    const q2 = `
      SELECT ${selectCols.join(", ")}
      FROM t
      WHERE "${teamCol}" = '${escapeSql(r2.found!)}'
    `;

    const rs1 = await conn.query(q1);
    const rs2 = await conn.query(q2);

    const rows1 = rs1.toArray();
    const rows2 = rs2.toArray();

    /* === Sélection 1 joueur par rôle (TOP/JGL/MID/ADC/SUP) === */
    function toPlayers(rows: any[], team: string): PlayerStats[] {
      // 1) déduplique par joueur (garde le meilleur EGPM10 puis 365d)
      const keyPlayer = (r: any) => String(r.player_col ?? "").trim();
      const egpmVal = (r: any) => Number(r["earned_gpm_avg_last_10"]) ?? Number(r["earned_gpm_avg_last_365d"]) ?? -1e9;

      const bestRowByPlayer = new Map<string, any>();
      for (const r of rows) {
        const name = keyPlayer(r);
        if (!name) continue;
        const cur = bestRowByPlayer.get(name);
        if (!cur || egpmVal(r) > egpmVal(cur)) bestRowByPlayer.set(name, r);
      }

      const asPlayerStats = (r: any): PlayerStats => ({
        team,
        teamname: team,
        player: String(r.player_col ?? "").trim(),
        position: posCol ? String(r.pos_col ?? "") : undefined,
        kda_last_10: toNum(r["kda_last_10"]),
        kda_last_20: toNum(r["kda_last_20"]),
        earned_gpm_avg_last_10: toNum(r["earned_gpm_avg_last_10"]),
        earned_gpm_avg_last_365d: toNum(r["earned_gpm_avg_last_365d"]),
        dpm_avg_last_365d: toNum(r["dpm_avg_last_365d"]),
        wcpm_avg_last_365d: toNum(r["wcpm_avg_last_365d"]),
        vspm_avg_last_365d: toNum(r["vspm_avg_last_365d"]),
      });

      const uniquePlayers = Array.from(bestRowByPlayer.values()).map(asPlayerStats);

      const normRole = (s?: string) => {
        const u = String(s || "").toUpperCase();
        if (/\bTOP\b/.test(u)) return "TOP";
        if (/\b(JGL|JUNG|JUNGLE|JUNGLER)\b/.test(u)) return "JGL";
        if (/\bMID\b/.test(u)) return "MID";
        if (/\b(ADC|BOT|BOTTOM)\b/.test(u)) return "ADC";
        if (/\b(SUP|SUPP|SUPPORT)\b/.test(u)) return "SUP";
        return "UNK";
      };

      const score = (p: PlayerStats) => {
        const a = Number(p.earned_gpm_avg_last_10 ?? -1e9);
        const b = Number(p.earned_gpm_avg_last_365d ?? -1e9);
        const c = Number(p.kda_last_10 ?? p.kda_last_20 ?? -1e9);
        return a * 1e6 + b * 1e3 + c;
      };

      const bestByRole = new Map<string, PlayerStats>();
      for (const p of uniquePlayers) {
        const role = normRole(p.position);
        if (role === "UNK") continue;
        const cur = bestByRole.get(role);
        if (!cur || score(p) > score(cur)) bestByRole.set(role, p);
      }

      const order = ["TOP", "JGL", "MID", "ADC", "SUP"] as const;
      const picked: PlayerStats[] = [];
      for (const r of order) {
        const p = bestByRole.get(r);
        if (p) picked.push(p);
      }

      if (picked.length < 5) {
        const already = new Set(picked.map((p) => p.player));
        const rest = uniquePlayers.filter((p) => !already.has(p.player)).sort((a, b) => score(b) - score(a));
        for (const p of rest) {
          picked.push(p);
          if (picked.length >= 5) break;
        }
      }

      return picked.slice(0, 5);
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
