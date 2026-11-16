import { Link } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import { useTr } from "@/hooks/useTr";

export const Footer = () => {
  const { tr } = useTr();
  const cols = [
    { h: tr("Produits", "Products"), l: [[tr("Probabilités", "Probabilities"), "/predictions"], [tr("Cotes & value bets", "Odds & value bets"), "/track-record#details"], [tr("Jeux de données", "Datasets"), "/track-record#verification"]] },
    { h: tr("Transparence", "Transparency"), l: [["Track record LoL", "/track-record"], [tr("Vérifier les chiffres", "Verify the numbers"), "/track-record#verification"], ["CS2 · paper trading", "/cs2"]] },
    { h: tr("Recherche", "Research"), l: [[tr("Labs · algos en développement", "Labs · algorithms in development"), "/labs"], ["Dota 2", "/dota2"]] },
    { h: tr("Société", "Company"), l: [[tr("À propos", "About"), "/about"], [tr("Contact", "Contact"), "/about#contact"]] },
  ];
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Link to="/" className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-gaming"><Gamepad2 className="h-[18px] w-[18px] text-background" /></span>
            <span className="font-display text-lg font-bold">PredictEsport</span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">{tr("Données, probabilités et cotes esport, avec preuves publiques.", "Esports data, probabilities and odds, with public proof.")}</p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">{c.h}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {c.l.map(([t, to]) => <li key={t}><Link className="transition-colors hover:text-foreground" to={to}>{t}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="container mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-muted-foreground">
          © {new Date().getFullYear()} PredictEsport. {tr(
            "Les performances passées ne garantissent pas les résultats futurs. Les paris comportent un risque de perte en capital. Informations fournies à titre indicatif, sans conseil financier. Réservé aux personnes majeures.",
            "Past performance does not guarantee future results. Betting involves risk of loss. Information only, not financial advice. 18+ only.",
          )}
        </div>
      </div>
    </footer>
  );
};
