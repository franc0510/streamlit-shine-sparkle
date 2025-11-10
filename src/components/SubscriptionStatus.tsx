import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, RefreshCw, ExternalLink, Sparkles } from "lucide-react";
import { createCheckoutSession, openCustomerPortal } from "@/lib/subscription";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

/**
 * SubscriptionStatus - Affiche le statut d'abonnement de l'utilisateur
 * et permet de gérer son abonnement
 */
export const SubscriptionStatus = () => {
  const { subscriptionStatus, isPremium, isLoading, refreshSubscription } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour passer Premium",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      const checkoutUrl = await createCheckoutSession(user.email);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        toast({
          title: "Redirection vers Stripe",
          description: "Vous allez être redirigé...",
        });
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement",
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const portalUrl = await openCustomerPortal();
      if (portalUrl) {
        window.open(portalUrl, "_blank");
        toast({
          title: "Portail client ouvert",
          description: "Gérez votre abonnement dans le nouvel onglet",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'ouvrir le portail client",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className={isPremium ? "border-primary/50 bg-gradient-to-br from-primary/5 to-background" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              isPremium ? "bg-primary/20" : "bg-muted"
            }`}>
              {isPremium ? (
                <Crown className="h-6 w-6 text-primary" />
              ) : (
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Abonnement
                <Badge variant={isPremium ? "default" : "secondary"}>
                  {isPremium ? "Premium" : "Gratuit"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {isPremium
                  ? "Vous avez accès à toutes les fonctionnalités"
                  : "Passez Premium pour débloquer tous les matchs"}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshSubscription}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPremium ? (
          <>
            {subscriptionStatus.subscription_end && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  Renouvellement le {formatDate(subscriptionStatus.subscription_end)}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleManageSubscription}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Gérer mon abonnement
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-2 font-semibold">Version gratuite</h4>
              <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                <li>Accès à 1 match seulement</li>
                <li>Fonctionnalités limitées</li>
              </ul>
            </div>
            <div className="rounded-lg bg-primary/10 p-4">
              <h4 className="mb-2 flex items-center gap-2 font-semibold text-primary">
                <Crown className="h-5 w-5" />
                Premium
              </h4>
              <ul className="ml-4 list-disc space-y-1 text-sm">
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
              disabled={isLoading || !user}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Passer Premium
            </Button>
            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                Connectez-vous pour passer Premium
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
