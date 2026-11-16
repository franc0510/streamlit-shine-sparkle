import { Link } from "react-router-dom";
import { useTr } from "@/hooks/useTr";

export const Footer = () => {
  const { tr } = useTr();
  return (
    <footer className="mt-10 border-t border-border bg-card/30">
      <div className="container mx-auto grid gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <div className="mb-2 font-display text-xl font-bold">PredictEsport</div>
          <p className="text-muted-foreground">
            {tr("Données, probabilités et cotes esport — avec preuves publiques.", "Esports data, probabilities and odds — with public proof.")}
          </p>
        </div>
        <ul className="space-y-1.5 text-muted-foreground">
          <li><Link className="hover:text-foreground" to="/track-record">{tr("Track record LoL", "LoL track record")}</Link></li>
          <li><Link className="hover:text-foreground" to="/labs">{tr("Labs : algos en développement", "Labs: algorithms in development")}</Link></li>
          <li><Link className="hover:text-foreground" to="/cs2">{tr("CS2 en test", "CS2 in testing")}</Link></li>
          <li><Link className="hover:text-foreground" to="/track-record#verification">{tr("Vérifier les chiffres", "Verify the numbers")}</Link></li>
        </ul>
        <ul className="space-y-1.5 text-muted-foreground">
          <li><Link className="hover:text-foreground" to="/predictions">{tr("Prédictions du jour", "Today's predictions")}</Link></li>
          <li><Link className="hover:text-foreground" to="/pricing">{tr("Tarifs", "Pricing")}</Link></li>
          <li><Link className="hover:text-foreground" to="/about#contact">{tr("Contact", "Contact")}</Link></li>
        </ul>
      </div>
      <div className="border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground">
        {tr(
          "Les performances passées ne garantissent pas les résultats futurs. Les paris comportent un risque de perte. Informations fournies à titre indicatif, sans conseil financier. Réservé aux personnes majeures.",
          "Past performance does not guarantee future results. Betting involves risk of loss. Information only, not financial advice. 18+ only.",
        )}
      </div>
    </footer>
  );
};
