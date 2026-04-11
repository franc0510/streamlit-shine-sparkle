import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import { STRIPE_PAYMENT_LINK } from "@/lib/subscription";
interface PremiumGateProps {
  children: React.ReactNode;
  freeLimit?: number;
  currentCount?: number;
  featureName?: string;
}

/**
 * PremiumGate - Composant pour limiter l'accès selon le statut premium
 * 
 * Usage:
 * <PremiumGate freeLimit={1} currentCount={matchCount} featureName="matchs">
 *   <MatchList />
 * </PremiumGate>
 */
export const PremiumGate = ({
  children,
  freeLimit = 1,
  currentCount = 0,
  featureName = "contenus",
}: PremiumGateProps) => {
  const { isPremium, isLoading } = useSubscription();

  const handleUpgrade = () => {
    window.location.href = STRIPE_PAYMENT_LINK;
  };

  // Si premium, afficher tout le contenu
  if (isPremium) {
    return <>{children}</>;
  }

  // Si utilisateur FREE et limite atteinte
  if (currentCount >= freeLimit) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Contenu Premium</CardTitle>
          <CardDescription className="text-base">
            Vous avez atteint la limite gratuite de {freeLimit} {featureName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 flex items-center gap-2 font-semibold">
              <Sparkles className="h-5 w-5 text-primary" />
              Avec Premium, débloquez :
            </h4>
            <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
              <li>Accès illimité à tous les matchs</li>
              <li>Statistiques détaillées</li>
              <li>Analyses avancées</li>
              <li>Support prioritaire</li>
            </ul>
          </div>
          <Button
            onClick={handleUpgrade}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Passer Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Afficher le contenu avec un avertissement
  return (
    <div className="space-y-4">
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">
                Version Gratuite - {currentCount}/{freeLimit} {featureName} consultés
              </p>
              <p className="text-sm text-muted-foreground">
                Passez Premium pour un accès illimité
              </p>
            </div>
          </div>
          <Button onClick={handleUpgrade} variant="outline" size="sm">
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrader
          </Button>
        </CardContent>
      </Card>
      {children}
    </div>
  );
};
