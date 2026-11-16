#!/usr/bin/env python3
"""Compare les fichiers regénérés (dossier passé en argument) à ceux publiés dans public/data.
Usage : python scripts/build_stats.py --lol L --cs2 C --out /tmp/check && python scripts/verify_stats.py /tmp/check
Sortie 0 = identiques (hors horodatage du manifeste)."""
import hashlib, sys
from pathlib import Path

fresh, pub = Path(sys.argv[1]), Path(__file__).resolve().parent.parent / "public" / "data"
ok = True
for f in sorted(pub.glob("*")):
    if f.name == "manifest.json":
        continue
    g = fresh / f.name
    a = hashlib.sha256(f.read_bytes()).hexdigest()
    b = hashlib.sha256(g.read_bytes()).hexdigest() if g.exists() else "absent"
    print("OK  " if a == b else "DIFF", f.name)
    ok &= a == b
sys.exit(0 if ok else 1)
