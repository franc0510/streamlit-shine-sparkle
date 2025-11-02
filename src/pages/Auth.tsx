import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, User, CreditCard, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { createCheckoutSession, openCustomerPortal } from "@/lib/subscription";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Email invalide" })
    .max(255, { message: "Email trop long" }),
  password: z.string()
    .min(8, { message: "Mot de passe d'au moins 8 caractères" })
    .max(100, { message: "Mot de passe trop long" }),
});

const signupSchema = loginSchema.extend({
  name: z.string()
    .trim()
    .min(2, { message: "Nom trop court" })
    .max(100, { message: "Nom trop long" }),
});
const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isPremium, subscriptionStatus, refreshSubscription } = useSubscription();

  useEffect(() => {
    // Pas de redirection automatique depuis la page abonnement
    // On laisse l'utilisateur gérer son abonnement ici même s'il est connecté
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationResult = loginSchema.safeParse({ email, password });
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation échouée",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: validationResult.data.email,
        password: validationResult.data.password,
      });

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connexion réussie !",
          description: "Bienvenue sur PredictEsport",
        });
        setTimeout(() => {
          window.location.assign("/");
        }, 150);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationResult = signupSchema.safeParse({ email, password, name });
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation échouée",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: validationResult.data.email,
        password: validationResult.data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: validationResult.data.name,
          },
        },
      });

      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Compte créé !",
          description: "Connexion automatique en cours...",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour vous abonner",
        variant: "destructive",
      });
      return;
    }

    setCheckoutLoading(true);
    try {
      const url = await createCheckoutSession();
      if (url) {
        window.location.href = url;
        return;
      } else {
        throw new Error("Impossible de créer la session de paiement");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer la session de paiement",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setCheckoutLoading(true);
    try {
      const url = await openCustomerPortal();
      if (url) {
        window.open(url, '_blank');
        toast({
          title: "Portail client ouvert",
          description: "Gérez votre abonnement dans la nouvelle fenêtre",
        });
      } else {
        throw new Error("Impossible d'ouvrir le portail client");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le portail de gestion",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const pricingFeatures = [
    "Accès à toutes les prédictions LoL",
    "Analyses détaillées des matchs",
    "Statistiques avancées",
    "Notifications des nouveaux matchs",
    "Support prioritaire",
    "Accès anticipé aux nouveaux jeux (CS2, DOTA2)",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 bg-gradient-gaming bg-clip-text text-transparent">
              Accès Premium
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Créez votre compte et accédez aux meilleures prédictions e-sport
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {!user ? (
              <Card className="p-8 bg-gradient-card border-border/50 animate-slide-up">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Connexion</TabsTrigger>
                    <TabsTrigger value="signup">Inscription</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Mot de passe</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? "Connexion..." : "Se connecter"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Nom</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            placeholder="Votre nom"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Mot de passe</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? "Création..." : "Créer mon compte"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </Card>
            ) : (
              <Card className="p-8 bg-gradient-card border-border/50 animate-slide-up flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Vous êtes connecté</h3>
                  <p className="text-muted-foreground mb-4">
                    {user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Découvrez notre offre Premium ci-contre →
                  </p>
                </div>
              </Card>
            )}

            <Card className="p-8 bg-gradient-card border-border/50 relative overflow-hidden animate-slide-up" style={{ animationDelay: "0.1s" }}>
              {isPremium ? (
                <>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-primary-foreground">Actif</Badge>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-3xl font-display font-bold mb-2">Abonnement Premium</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-display font-bold bg-gradient-gaming bg-clip-text text-transparent">
                        10€
                      </span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                    {subscriptionStatus.subscription_end && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Renouvellement le {new Date(subscriptionStatus.subscription_end).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
                    {pricingFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground/90">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full gap-2" 
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={checkoutLoading}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {checkoutLoading ? "Ouverture..." : "Gérer mon abonnement"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Annulation possible à tout moment
                  </p>
                </>
              ) : (
                <>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-accent text-accent-foreground">Populaire</Badge>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-3xl font-display font-bold mb-2">Abonnement Premium</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-display font-bold bg-gradient-gaming bg-clip-text text-transparent">
                        10€
                      </span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {pricingFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground/90">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full gap-2" 
                    variant="default"
                    onClick={handleSubscribe}
                    disabled={!user || checkoutLoading}
                  >
                    <CreditCard className="w-4 h-4" />
                    {checkoutLoading ? "Chargement..." : !user ? "Connectez-vous d'abord" : "S'abonner maintenant"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Annulation possible à tout moment
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PredictEsport. Tous droits réservés.</p>
          <p className="mt-2 text-xs max-w-3xl mx-auto">
            Les prédictions sont alimentées par PredictEsport. Le système utilise une approche purement mathématique basée sur les statistiques historiques des joueurs et des équipes pour estimer les probabilités de victoire en série. Il s'agit uniquement d'un outil d'analyse et de statistiques — il n'encourage pas les paris sur les matchs.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
