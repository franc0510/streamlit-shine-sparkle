# Transparence des stats

`scripts/build_stats.py` recalcule tout `public/data/*` depuis les dépôts LoL et CS2 (aucune saisie manuelle).
`manifest.json` liste chaque fichier source (SHA-256, dernier commit) et chaque sortie (SHA-256).
Règles : PnL marché = REDEEM − BUY ; sans REDEEM ≥ 1 jour avant la dernière donnée = perdu ; plus récent = en attente (exclu).
Le wallet n'est jamais publié. Mise à jour : workflow `sync-stats.yml` (toutes les 6 h) — nécessite le secret `SOURCE_REPOS_TOKEN`.
Limite connue : `polymarket_trades.csv` (LoL) n'est rafraîchi que par le workflow `fetch_positions` ; tant qu'il n'a pas tourné, le bandeau de fraîcheur du site l'affiche.
