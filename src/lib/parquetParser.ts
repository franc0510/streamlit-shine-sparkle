/* eslint-disable @typescript-eslint/no-explicit-any */
import * as duckdb from "@duckdb/duckdb-wasm";

export type TimeWindow = "last_10" | "last_20" | "last_365d";
export type ScaleMode = "none" | "minmax" | "zscore";

/* ======================= Types ======================= */
export type PlayerStats = {
  team: string;
  teamname?: string;
  player: string;
  player_name?: string;
  position?: string;

  // === Joueur: colonnes exactes ===
  kda_last_10?: number;
  kda_last_20?: number;

  earned_gpm_avg_last_10?: number;
  earned_gpm_avg_last_20?: number;
  earned_gpm_avg_last_365d?: number;

  cspm_avg_last_10?: number;
  cspm_avg_last_20?: number;
  cspm_avg_last_365d?: number;

  vspm_avg_last_10?: number;
  vspm_avg_last_20?: number;
  vspm_avg_last_365d?: number;

  dpm_avg_last_10?: number;
  dpm_avg_last_20?: number;
  dpm_avg_last_365d?: number; // on mappe aussi dpm_avg_last_365 vers ceci
};

export type TeamAggregates = Record<string, number>;

export type TeamMeta = {
  team_winrate_last_10?: number;
  team_winrate_last_20?: number;
  team_winrate_last_year?: number; // (365d)
  power_team?: number;
};

export type TeamStats = {
  team: string;
  players: PlayerStats[]; // 5 joueurs sélectionnés
  aggregates: TeamAggregates;
  meta: TeamMeta; // winrates + power_team
  resolvedFrom: string;
};

export type ParseResult = [TeamStats, TeamStats];

/* ======================= URL helper ======================= */
function assetUrl(relPath: string): string {
  const rel = relPath.replace(/^\/+/, "");
  const baseTagHref = document.querySelector("base")?.getAttribute("href") || "";
  const baseFromTag = baseTagHref ? new URL(baseTagHref, window.location.origin).pathname : "";
  // @ts-ignore
  const baseFromVite: string = (import.meta as any)?.env?.BASE_URL || "";
  const base = (baseFromTag || baseFromVite || "/").toString();
  const normBase = (base.startsWith("/") ? base : "/" + base).replace(/\/+$/, "");
  return new URL(`${normBase}/${rel}`, window.location.origin).toString();
}

const PARQUET_URL = assetUrl("Documents/DF_filtered.parquet");

/* ======================= Aliases équipes ======================= */
const TEAM_ALIASES: Record<string, string> = {
  // Gen.G – variantes
  "GEN G": "Gen.G",
  "GEN.G": "Gen.G",
  GENG: "Gen.G",
  "GEN G ESPORTS": "Gen.G",
  "GEN.G ESPORTS": "Gen.G",
  "GENG ESPORTS": "Gen.G",

  // Autres alias utiles/frequents
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

// Mots génériques à ignorer pour le matching
const STOPWORDS = new Set(["TEAM", "TEAMS", "ESPORT", "ESPORTS", "E-SPORTS", "GAMING", "CLUB"]);

function canonKey(s: string) {
  const k = normKey(s);
  const kept = k
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t))
    .join(" ");
  return kept || k;
}

function applyAlias(s: string) {
  const k = normKey(s);
  return TEAM_ALIASES[k] ?? s;
}

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/* ======================= duckdb-wasm ======================= */
let _db: duckdb.AsyncDuckDB | null = null;
async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (_db) return _db;
  const DUCKDB_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);

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

/* ======================= Introspection table ======================= */
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
  const keyNorm = normKey(wantAliased);
  const keyCanon = canonKey(wantAliased);

  const indexNorm = new Map<string, string>();
  const indexCanon = new Map<string, string>();
  for (const c of candidates) {
    const aliased = applyAlias(c);
    indexNorm.set(normKey(aliased), c);
    indexCanon.set(canonKey(aliased), c);
  }

  if (indexNorm.has(keyNorm)) return { found: indexNorm.get(keyNorm), why: "equal(norm)" };
  if (indexCanon.has(keyCanon)) return { found: indexCanon.get(keyCanon), why: "equal(canon)" };

  for (const [k, v] of indexCanon.entries()) {
    if (keyCanon.includes(k) || k.includes(keyCanon)) return { found: v, why: "contains(canon)" };
  }
  for (const [k, v] of indexNorm.entries()) {
    if (keyNorm.includes(k) || k.includes(keyNorm)) return { found: v, why: "contains(norm)" };
  }

  const nospace = (s: string) => s.replace(/\s+/g, "");
  for (const [k, v] of indexCanon.entries()) {
    if (nospace(k) === nospace(keyCanon)) return { found: v, why: "stripSpacesEqual(canon)" };
  }

  return { why: "not_found" };
}

/* ======================= KPI map (colonnes) ======================= */
const KPI_MAP: Record<string, string[]> = {
  // Joueur
  kda_last_10: ["kda_last_10"],
  kda_last_20: ["kda_last_20"],

  earned_gpm_avg_last_10: ["earned_gpm_avg_last_10"],
  earned_gpm_avg_last_20: ["earned_gpm_avg_last_20"],
  earned_gpm_avg_last_365d: ["earned_gpm_avg_last_365d"],

  cspm_avg_last_10: ["cspm_avg_last_10"],
  cspm_avg_last_20: ["cspm_avg_last_20"],
  cspm_avg_last_365d: ["cspm_avg_last_365d"],

  vspm_avg_last_10: ["vspm_avg_last_10"],
  vspm_avg_last_20: ["vspm_avg_last_20"],
  vspm_avg_last_365d: ["vspm_avg_last_365d"],

  dpm_avg_last_10: ["dpm_avg_last_10"],
  dpm_avg_last_20: ["dpm_avg_last_20"],
  // on accepte dpm_avg_last_365 et dpm_avg_last_365d → on renomme en dpm_avg_last_365d côté JS
  dpm_avg_last_365d: ["dpm_avg_last_365d", "dpm_avg_last_365"],

  // Équipe
  team_winrate_last_10: ["team_winrate_last_10"],
  team_winrate_last_20: ["team_winrate_last_20"],
  team_winrate_last_year: ["team_winrate_last_year", "team_winrate_last_365d"],
  power_team: ["power_team"],
};

function pickColName(existing: string[], candidates: string[]): string | null {
  const low = existing.map((c) => c.toLowerCase());
  for (const c of candidates) {
    const i = low.indexOf(c.toLowerCase());
    if (i >= 0) return existing[i];
  }
  return null;
}

/* ======================= API export: image joueurs ======================= */
export function getPlayerImage(playerName: string): string {
  return assetUrl(`Documents/teams/${String(playerName || "").trim()}.png`);
}

/* ======================= Helpers agrégats ======================= */
function aggregatesFrom(players: PlayerStats[]): TeamAggregates {
  const keys = [
    "kda_last_10",
    "kda_last_20",
    "earned_gpm_avg_last_10",
    "earned_gpm_avg_last_20",
    "earned_gpm_avg_last_365d",
    "cspm_avg_last_10",
    "cspm_avg_last_20",
    "cspm_avg_last_365d",
    "vspm_avg_last_10",
    "vspm_avg_last_20",
    "vspm_avg_last_365d",
    "dpm_avg_last_10",
    "dpm_avg_last_20",
    "dpm_avg_last_365d",
  ] as const;

  const out: TeamAggregates = {};
  for (const k of keys) {
    const vals = players.map((p) => toNum((p as any)[k])).filter((x): x is number => typeof x === "number");
    out[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }
  return out;
}

/* ======================= Main ======================= */
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
      throw new Error(`Team resolution failed: (${team1} → ${r1.why}) / (${team2} → ${r2.why}). Sample: ${sample}`);
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

      // joueur KPIs
      ...[
        "kda_last_10",
        "kda_last_20",
        "earned_gpm_avg_last_10",
        "earned_gpm_avg_last_20",
        "earned_gpm_avg_last_365d",
        "cspm_avg_last_10",
        "cspm_avg_last_20",
        "cspm_avg_last_365d",
        "vspm_avg_last_10",
        "vspm_avg_last_20",
        "vspm_avg_last_365d",
        "dpm_avg_last_10",
        "dpm_avg_last_20",
        "dpm_avg_last_365d",
      ].map((k) => (kpiCols[k] ? `${JSON.stringify(kpiCols[k])} as "${k}"` : null)),

      // équipe
      ...["team_winrate_last_10", "team_winrate_last_20", "team_winrate_last_year", "power_team"].map((k) =>
        kpiCols[k] ? `${JSON.stringify(kpiCols[k])} as "${k}"` : null,
      ),
    ].filter(Boolean) as string[];

    const esc = (v: string) => v.replace(/'/g, "''");
    const qFor = (team: string) => `
      SELECT ${selectCols.join(", ")}
      FROM t
      WHERE "${teamCol}" = '${esc(team)}'
    `;

    const [rs1, rs2] = await Promise.all([conn.query(qFor(r1.found!)), conn.query(qFor(r2.found!))]);
    const rows1 = rs1.toArray();
    const rows2 = rs2.toArray();

    // === 1 joueur par rôle
    function toPlayers(rows: any[], team: string): PlayerStats[] {
      const keyPlayer = (r: any) => String(r.player_col ?? "").trim();
      const egpm10 = (r: any) => Number(r["earned_gpm_avg_last_10"]) ?? -1e9;

      const bestRowByPlayer = new Map<string, any>();
      for (const r of rows) {
        const name = keyPlayer(r);
        if (!name) continue;
        const cur = bestRowByPlayer.get(name);
        if (!cur || egpm10(r) > egpm10(cur)) bestRowByPlayer.set(name, r);
      }

      const asPlayer = (r: any): PlayerStats => ({
        team,
        teamname: team,
        player: String(r.player_col ?? "").trim(),
        position: posCol ? String(r.pos_col ?? "") : undefined,

        kda_last_10: toNum(r["kda_last_10"]),
        kda_last_20: toNum(r["kda_last_20"]),

        earned_gpm_avg_last_10: toNum(r["earned_gpm_avg_last_10"]),
        earned_gpm_avg_last_20: toNum(r["earned_gpm_avg_last_20"]),
        earned_gpm_avg_last_365d: toNum(r["earned_gpm_avg_last_365d"]),

        cspm_avg_last_10: toNum(r["cspm_avg_last_10"]),
        cspm_avg_last_20: toNum(r["cspm_avg_last_20"]),
        cspm_avg_last_365d: toNum(r["cspm_avg_last_365d"]),

        vspm_avg_last_10: toNum(r["vspm_avg_last_10"]),
        vspm_avg_last_20: toNum(r["vspm_avg_last_20"]),
        vspm_avg_last_365d: toNum(r["vspm_avg_last_365d"]),

        dpm_avg_last_10: toNum(r["dpm_avg_last_10"]),
        dpm_avg_last_20: toNum(r["dpm_avg_last_20"]),
        dpm_avg_last_365d: toNum(r["dpm_avg_last_365d"]),
      });

      const normRole = (s?: string) => {
        const u = String(s || "").toUpperCase();
        if (/\bTOP\b/.test(u)) return "TOP";
        if (/\b(JGL|JUNG|JUNGLE|JUNGLER)\b/.test(u)) return "JGL";
        if (/\bMID\b/.test(u)) return "MID";
        if (/\b(ADC|BOT|BOTTOM)\b/.test(u)) return "ADC";
        if (/\b(SUP|SUPP|SUPPORT)\b/.test(u)) return "SUP";
        return "UNK";
      };

      const unique = Array.from(bestRowByPlayer.values()).map(asPlayer);
      const order = ["TOP", "JGL", "MID", "ADC", "SUP"] as const;
      const score = (p: PlayerStats) =>
        (p.earned_gpm_avg_last_10 ?? -1e9) * 1e6 +
        (p.earned_gpm_avg_last_365d ?? -1e9) * 1e3 +
        (p.kda_last_10 ?? p.kda_last_20 ?? -1e9);

      const bestByRole = new Map<string, PlayerStats>();
      for (const p of unique) {
        const role = normRole(p.position);
        if (role === "UNK") continue;
        const cur = bestByRole.get(role);
        if (!cur || score(p) > score(cur)) bestByRole.set(role, p);
      }

      const picked: PlayerStats[] = [];
      for (const r of order) {
        const p = bestByRole.get(r);
        if (p) picked.push(p);
      }
      if (picked.length < 5) {
        const already = new Set(picked.map((p) => p.player));
        unique
          .filter((p) => !already.has(p.player))
          .sort((a, b) => score(b) - score(a))
          .slice(0, 5 - picked.length)
          .forEach((p) => picked.push(p));
      }
      return picked.slice(0, 5);
    }

    // === méta équipe (winrates/power) : 1ère valeur non-nulle
    function extractTeamMeta(rows: any[]): TeamMeta {
      const first = (key: string) => {
        for (const r of rows) {
          const v = toNum(r[key]);
          if (typeof v === "number") return v;
        }
        return undefined;
      };
      return {
        team_winrate_last_10: first("team_winrate_last_10"),
        team_winrate_last_20: first("team_winrate_last_20"),
        team_winrate_last_year: first("team_winrate_last_year"),
        power_team: first("power_team"),
      };
    }

    const players1 = toPlayers(rows1, r1.found!);
    const players2 = toPlayers(rows2, r2.found!);

    const teamA: TeamStats = {
      team: r1.found!,
      players: players1,
      aggregates: aggregatesFrom(players1),
      meta: extractTeamMeta(rows1),
      resolvedFrom: r1.found!,
    };
    const teamB: TeamStats = {
      team: r2.found!,
      players: players2,
      aggregates: aggregatesFrom(players2),
      meta: extractTeamMeta(rows2),
      resolvedFrom: r2.found!,
    };

    return [teamA, teamB];
  } finally {
    await conn.close();
  }
}
