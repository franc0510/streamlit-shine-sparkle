#!/usr/bin/env python3
"""
Construit les fichiers de stats publics du site à partir des deux dépôts sources.

    python scripts/build_stats.py --lol ../Francky-Predictor-Esports---LOL \
                                  --cs2 ../Francky-Predictor-Esports---CS2 \
                                  --out public/data

Principes (transparence) :
  * AUCUN chiffre n'est saisi à la main : tout est recalculé depuis les fichiers des dépôts.
  * Chaque fichier source utilisé est listé dans manifest.json avec son SHA-256, le dernier
    commit qui l'a modifié et la date de ce commit -> n'importe qui peut re-vérifier.
  * Le wallet et les hash de transactions ne sont PAS publiés (seulement le slug public du marché
    Polymarket, la mise, le résultat).
  * Règle de résolution identique à analyze_bets_roi.py du dépôt LoL :
      PnL d'un marché = somme(REDEEM) - somme(BUY).  Pas de REDEEM un jour après le match = perdu.
    Les marchés trop récents pour être tranchés sont marqués « en attente », jamais comptés.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

TRACK_START = pd.Timestamp("2026-08-13", tz="UTC")  # début du suivi public LoL


# ----------------------------------------------------------------------------- utilitaires
def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def git(repo: Path, *args: str) -> str:
    try:
        return subprocess.check_output(["git", "-C", str(repo), *args], text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ""


class Manifest:
    """Registre des fichiers sources réellement lus."""

    def __init__(self) -> None:
        self.repos: dict[str, dict] = {}
        self.files: list[dict] = []

    def repo(self, key: str, path: Path, slug: str) -> None:
        self.repos[key] = {
            "github": f"franc0510/{slug}",
            "head_commit": git(path, "rev-parse", "HEAD"),
            "head_date": git(path, "log", "-1", "--format=%cI"),
        }

    def add(self, key: str, repo_path: Path, rel: str, role: str) -> Path:
        p = repo_path / rel
        if not p.exists():
            raise FileNotFoundError(p)
        sha = git(repo_path, "log", "-1", "--format=%H", "--", rel)
        # Manifeste PUBLIC : aucun nom de dépôt, de chemin, ni de commit.
        self.files.append({
            "id": f"{key}-{len(self.files) + 1}",
            "role": role,
            "sha256": sha256(p),
            "bytes": p.stat().st_size,
            "last_update": git(repo_path, "log", "-1", "--format=%cI", "--", rel)[:10],
        })
        return p


def jdump(obj, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=1, allow_nan=False, default=_json_default) + "\n", encoding="utf-8")


def _json_default(o):
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating,)):
        return None if np.isnan(o) else float(o)
    if isinstance(o, (pd.Timestamp, datetime)):
        return o.isoformat()
    raise TypeError(type(o))


def clean(d):
    """NaN/inf -> None, récursivement (JSON strict)."""
    if isinstance(d, dict):
        return {k: clean(v) for k, v in d.items()}
    if isinstance(d, list):
        return [clean(v) for v in d]
    if isinstance(d, float) and (np.isnan(d) or np.isinf(d)):
        return None
    return d


# ----------------------------------------------------------------------------- LoL
LEAGUE_TAGS = [
    ("Worlds", "Worlds"), ("MSI", "MSI"), ("EMEA Masters", "EMEA Masters"), ("LEC", "LEC"), ("LCK", "LCK"),
    ("LPL", "LPL"), ("LCS", "LCS"), ("North American Challengers", "NACL"), ("LFL", "LFL"),
    ("Rift Legends", "Rift Legends"), ("Demacia", "Demacia Cup"), ("CBLOL", "CBLOL"), ("LJL", "LJL"),
    ("LCP", "LCP"), ("PCS", "PCS"), ("Prime League", "Prime League"), ("KeSPA", "KeSPA Cup"),
    ("NLC", "NLC"), ("TCL", "TCL"), ("LVP", "LVP"), ("Superliga", "Superliga"),
]


def league_from_title(title: str) -> str:
    m = re.search(r" - (.*)$", title or "")
    tail = m.group(1) if m else (title or "")
    for needle, label in LEAGUE_TAGS:
        if needle.lower() in tail.lower():
            return label
    return "Autres"


def bootstrap_roi(stake: np.ndarray, pnl: np.ndarray, n: int = 5000, seed: int = 42) -> list[float] | None:
    if len(stake) < 20:
        return None
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(stake), size=(n, len(stake)))
    roi = pnl[idx].sum(axis=1) / stake[idx].sum(axis=1)
    lo, hi = np.percentile(roi, [2.5, 97.5])
    return [float(lo), float(hi)]


def build_lol(lol: Path, out: Path, man: Manifest) -> dict:
    trades_p = man.add("lol", lol, "Documents/polymarket_trades.csv", "Historique d'activité Polymarket (BUY + REDEEM)")
    bets_p = man.add("lol", lol, "Documents/polymarket_auto_bets.csv", "Journal du bot (proba modèle, prix marché, mise)")
    pred_p = man.add("lol", lol, "Documents/predictions_history.csv", "Prédictions horodatées publiées")

    t = pd.read_csv(trades_p)
    t = t[t["slug"].astype(str).str.startswith("lol-")].copy()
    t["ts"] = pd.to_datetime(t["timestamp"], utc=True)
    t["usdcSize"] = pd.to_numeric(t["usdcSize"], errors="coerce").fillna(0.0)
    data_asof = t["ts"].max()

    rows = []
    for cid, g in t.groupby("conditionId"):
        buys, reds = g[g["type"] == "TRADE"], g[g["type"] == "REDEEM"]
        stake = float(buys["usdcSize"].sum())
        if stake <= 0:
            continue
        first_buy = buys["ts"].min()
        if first_buy < TRACK_START:
            continue
        slug = str(g["slug"].iloc[0])
        md = re.search(r"(\d{4}-\d{2}-\d{2})", slug)
        event_date = pd.Timestamp(md.group(1), tz="UTC") if md else first_buy.normalize()
        received = float(reds["usdcSize"].sum())
        shares = float(buys["size"].sum())
        avg_price = stake / shares if shares else np.nan
        # règle de résolution : redeem reçu -> gagné ; sinon perdu si le match date de > 1 jour
        # avant la dernière donnée disponible ; sinon en attente.
        if received > 0:
            status = "won"
        elif event_date <= data_asof.normalize() - pd.Timedelta(days=1):
            status = "lost"
        else:
            status = "pending"
        title = str(g["title"].iloc[0])
        rows.append({
            "event_date": event_date.date().isoformat(),
            "first_bet_utc": first_buy.strftime("%Y-%m-%dT%H:%MZ"),
            "league": league_from_title(title),
            "market": re.sub(r"^LoL:\s*", "", title),
            "bet_on": str(buys["outcome"].iloc[0]),
            "entry_price": round(avg_price, 4),
            "stake_usd": round(stake, 2),
            "payout_usd": round(received, 2) if status != "pending" else None,
            "pnl_usd": round(received - stake, 2) if status != "pending" else None,
            "status": status,
            "polymarket_slug": slug,
            "condition_id": cid,  # identifiant public du marché (pas du wallet)
        })
    led = pd.DataFrame(rows).sort_values(["event_date", "first_bet_utc"]).reset_index(drop=True)
    led.insert(0, "bet_no", np.arange(1, len(led) + 1))

    # ---- rapprochement avec le journal du bot : proba modèle et prix de décision
    ab = pd.read_csv(bets_p)
    ab = ab[ab["status"].isin(["placed", "partial"])].drop_duplicates("condition_id", keep="first")
    led = led.merge(ab[["condition_id", "model_prob", "market_price"]].rename(
        columns={"model_prob": "model_prob", "market_price": "decision_price"}), on="condition_id", how="left")
    # le journal du bot ne donne la proba que du côté de la sélection : on la garde telle quelle
    led["model_prob"] = led["model_prob"].round(4)

    settled = led[led["status"].isin(["won", "lost"])].copy()
    stake = settled["stake_usd"].to_numpy(float)
    pnl = settled["pnl_usd"].to_numpy(float)

    # courbe cumulée par jour de match
    daily = settled.groupby("event_date").agg(n=("bet_no", "size"), stake=("stake_usd", "sum"),
                                              pnl=("pnl_usd", "sum"), wins=("status", lambda s: (s == "won").sum()))
    full_idx = pd.date_range(TRACK_START.tz_localize(None), pd.Timestamp(daily.index.max()), freq="D").strftime("%Y-%m-%d")
    daily = daily.reindex(full_idx, fill_value=0.0)
    daily["cum_pnl"] = daily["pnl"].cumsum()
    daily["cum_stake"] = daily["stake"].cumsum()
    daily["cum_n"] = daily["n"].cumsum()
    daily["roi"] = np.where(daily["cum_stake"] > 0, daily["cum_pnl"] / daily["cum_stake"], np.nan)
    peak = daily["cum_pnl"].cummax().clip(lower=0)
    max_dd = float((daily["cum_pnl"] - peak).min())

    by_league = []
    for lg, g in settled.groupby("league"):
        by_league.append({"league": lg, "n": int(len(g)), "stake": round(float(g.stake_usd.sum()), 2),
                          "pnl": round(float(g.pnl_usd.sum()), 2),
                          "roi": round(float(g.pnl_usd.sum() / g.stake_usd.sum()), 4),
                          "win_rate": round(float((g.status == "won").mean()), 4)})
    by_league.sort(key=lambda r: -r["n"])

    by_month = []
    settled["month"] = settled["event_date"].str[:7]
    for mth, g in settled.groupby("month"):
        by_month.append({"month": mth, "n": int(len(g)), "stake": round(float(g.stake_usd.sum()), 2),
                         "pnl": round(float(g.pnl_usd.sum()), 2),
                         "roi": round(float(g.pnl_usd.sum() / g.stake_usd.sum()), 4)})

    # calibration "côté pari" : taux de réussite réel vs prix payé (probabilité implicite du marché)
    wins = (settled["status"] == "won").astype(float).to_numpy()
    entry = settled["entry_price"].to_numpy(float)
    edge_stats = {
        "avg_entry_price": float(np.nanmean(entry)),
        "implied_win_rate": float(np.nanmean(entry)),
        "actual_win_rate": float(wins.mean()),
        "avg_model_prob": float(np.nanmean(settled["model_prob"])) if settled["model_prob"].notna().any() else None,
        "n_with_model_prob": int(settled["model_prob"].notna().sum()),
    }
    # 8 buckets de prix d'entrée
    buckets = []
    edges = [0, .2, .35, .5, .65, .8, 1.01]
    settled["b"] = pd.cut(settled["entry_price"], edges, right=False)
    for b, g in settled.groupby("b", observed=True):
        buckets.append({"range": f"{b.left:.2f}-{min(b.right, 1):.2f}", "n": int(len(g)),
                        "avg_price": round(float(g.entry_price.mean()), 3),
                        "win_rate": round(float((g.status == 'won').mean()), 3),
                        "pnl": round(float(g.pnl_usd.sum()), 2)})

    # paris passés par le bot mais pas encore rapprochés (après la dernière activité wallet connue)
    ab_all = pd.read_csv(bets_p)
    ab_all["ts"] = pd.to_datetime(ab_all["timestamp"], utc=True)
    unreconciled = ab_all[(ab_all["status"].isin(["placed", "partial"])) & (ab_all["ts"] > data_asof)]

    # prédictions publiées et horodatées
    ph = pd.read_csv(pred_p, usecols=["run_ts_utc", "match_date_utc", "league", "status"])
    ph["run"] = pd.to_datetime(ph["run_ts_utc"], utc=True, errors="coerce", format="mixed")
    ph["md"] = pd.to_datetime(ph["match_date_utc"], utc=True, errors="coerce", format="mixed")
    since = ph[ph["run"] >= TRACK_START]
    ok = since[since["status"] == "ok"]
    pre_match = float((ok["run"] < ok["md"]).mean()) if len(ok) else None

    ci = bootstrap_roi(stake, pnl)
    summary = {
        "start": TRACK_START.date().isoformat(),
        "data_asof": data_asof.strftime("%Y-%m-%dT%H:%MZ"),
        "n_markets_total": int(len(led)),
        "n_settled": int(len(settled)),
        "n_pending": int((led["status"] == "pending").sum()),
        "n_won": int((settled["status"] == "won").sum()),
        "n_lost": int((settled["status"] == "lost").sum()),
        "win_rate": float(wins.mean()),
        "stake_usd": round(float(stake.sum()), 2),
        "pnl_usd": round(float(pnl.sum()), 2),
        "roi": float(pnl.sum() / stake.sum()),
        "roi_ci95": ci,
        "avg_stake_usd": round(float(stake.mean()), 2),
        "max_drawdown_usd": round(max_dd, 2),
        "best_bet_usd": round(float(pnl.max()), 2),
        "worst_bet_usd": round(float(pnl.min()), 2),
        "unreconciled_bets_after_asof": int(len(unreconciled)),
        "unreconciled_stake_usd": round(float(unreconciled["stake_usdc"].sum()), 2),
        "predictions_published_since_start": int(len(since)),
        "predictions_ok_since_start": int(len(ok)),
        "predictions_published_before_kickoff_share": pre_match,
    }
    track = clean({
        "summary": summary,
        "calibration": edge_stats,
        "price_buckets": buckets,
        "daily": [{"date": d, "pnl": round(r.pnl, 2), "stake": round(r.stake, 2), "n": int(r.n),
                   "cum_pnl": round(r.cum_pnl, 2), "cum_stake": round(r.cum_stake, 2), "cum_n": int(r.cum_n),
                   "roi": None if pd.isna(r.roi) else round(r.roi, 4)} for d, r in daily.iterrows()],
        "by_league": by_league,
        "by_month": by_month,
    })
    jdump(track, out / "lol_track_record.json")

    pub_cols = ["bet_no", "event_date", "league", "market", "bet_on", "entry_price", "stake_usd", "payout_usd",
                "pnl_usd", "status", "model_prob", "decision_price", "polymarket_slug", "condition_id"]
    led[pub_cols].to_csv(out / "lol_ledger.csv", index=False)
    return summary


# ----------------------------------------------------------------------------- CS2
def build_cs2(cs2: Path, out: Path, man: Manifest) -> dict:
    rep_p = man.add("cs2", cs2, "Documents/paper_report.json", "Rapport du paper bot")
    trd_p = man.add("cs2", cs2, "Documents/paper_trades.csv", "Journal du paper bot (toutes les décisions)")
    ev_p = man.add("cs2", cs2, "Documents/stage2_eval_c2.json", "Évaluation walk-forward du modèle")
    fr_p = man.add("cs2", cs2, "Documents/data_freshness.json", "Contrôles de fraîcheur des données")
    bs_p = man.add("cs2", cs2, "Documents/build_status.json", "Statut du build quotidien")

    rep = json.loads(rep_p.read_text())
    ev = json.loads(ev_p.read_text())
    fr = json.loads(fr_p.read_text())
    bs = json.loads(bs_p.read_text())
    trades = pd.read_csv(trd_p)

    mk = ev["market"]["all"]
    def pick(model):
        r = next((x for x in mk if x["model"] == model), None)
        return None if r is None else {k: r[k] for k in ("n", "logloss", "brier", "acc")}

    comparison = {"n": ev["market"]["n"], "market": pick("p1_dec"), "model": pick("ens"),
                  "blend_tier": pick("blend_tier"), "blend_tier_liq": pick("blend_tier_liq")}

    skips = rep.get("skip_reasons", {})
    decisions = int(len(trades))
    bet_rows = trades[trades["bet"].astype(str).str.lower() == "true"]

    status = {
        "mode": "paper",
        "stage": "test",
        "bankroll_virtual_usd": rep.get("bankroll"),
        "bankroll0_usd": rep.get("config", {}).get("bankroll0"),
        "period": rep.get("period"),
        "decisions_logged": decisions,
        "bets_logged": int(len(bet_rows)),
        "open": int(rep.get("by_status", {}).get("open", 0)),
        "skip_reasons": skips,
        "settled_bets": int(rep.get("bets", {}).get("n_bets", 0)),
        "report_generated_utc": rep.get("generated_utc"),
        "last_build_run_date": bs.get("run_date"),
        "data_ok": bool(fr.get("ok")),
        "data_checks": [{"check": c["check"], "ok": bool(c["ok"]), "detail": c["detail"] if isinstance(c["detail"], str) else json.dumps(c["detail"])} for c in fr.get("checks", [])],
        "last_finished_match_utc": fr.get("last_finished_match_utc"),
        "eval": {
            "variant": ev.get("variant"),
            "period": ev.get("period"),
            "n_series": next((x["n"] for x in ev["series_all"] if x["model"] == "lr_cal"), None),
            "vs_market": comparison,
            "reliability": ev.get("reliability_ens"),
        },
        "config": rep.get("config"),
        "note": rep.get("note"),
    }
    jdump(clean(status), out / "cs2_status.json")
    return status


# ----------------------------------------------------------------------------- main
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lol", required=True, type=Path)
    ap.add_argument("--cs2", required=True, type=Path)
    ap.add_argument("--out", default=Path("public/data"), type=Path)
    a = ap.parse_args()

    man = Manifest()
    man.repo("lol", a.lol, "Francky-Predictor-Esports---LOL")
    man.repo("cs2", a.cs2, "Francky-Predictor-Esports---CS2")

    lol = build_lol(a.lol, a.out, man)
    cs2 = build_cs2(a.cs2, a.out, man)

    me = Path(__file__).resolve()
    manifest = {
        "generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "rules": [
            "PnL d'un marché = somme des REDEEM - somme des BUY (Polymarket).",
            "Marché sans REDEEM, dont la date de match précède d'au moins 1 jour la dernière donnée connue = perdu.",
            "Marchés plus récents = 'pending', exclus de tous les totaux.",
            "Le suivi LoL commence le 2026-08-13. Aucune sélection : tous les marchés misés sont inclus.",
        ],
        "files": man.files,
        "outputs": [],
    }
    for f in sorted(a.out.glob("*")):
        if f.name != "manifest.json":
            manifest["outputs"].append({"path": f"data/{f.name}", "sha256": sha256(f), "bytes": f.stat().st_size})
    jdump(manifest, a.out / "manifest.json")
    print(f"LoL : {lol['n_settled']} marchés réglés, PnL {lol['pnl_usd']:+.2f} $, ROI {lol['roi']:+.1%}  (données jusqu'au {lol['data_asof']})")
    print(f"CS2 : {cs2['decisions_logged']} décisions papier, {cs2['bets_logged']} paris papier")
    return 0


if __name__ == "__main__":
    sys.exit(main())
