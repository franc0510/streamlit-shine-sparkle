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
import { createCheckoutSession, openCustomerPortal, STRIPE_PAYMENT_LINK, type DiagnosticStep } from "@/lib/subscription";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { SubscriptionErrorDialog } from "@/components/SubscriptionErrorDialog";
import { useTranslation } from "react-i18next";

const Auth = () => {
  const { t } = useTranslation();
  
  const loginSchema = z.object({
    email: z.string().trim().email({ message: t('auth.invalidEmail') }).max(255, { message: t('auth.emailTooLong') }),
    password: z
      .string()
      .min(8, { message: t('auth.passwordMin') })
      .max(100, { message: t('auth.passwordMax') }),
  });

  const signupSchema = loginSchema.extend({
    name: z.string().trim().min(2, { message: t('auth.nameTooShort') }).max(100, { message: t('auth.nameTooLong') }),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { user, session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticStep[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isPremium, isTrialing, trialEnd, subscriptionStatus, refreshSubscription } = useSubscription();

  // Consume ?next=<same-origin path> to return the user to a target
  // (e.g. the OAuth consent page) after authentication.
  const getSafeNext = (): string | null => {
    const raw = new URLSearchParams(window.location.search).get("next");
    if (!raw) return null;
    if (!raw.startsWith("/") || raw.startsWith("//")) return null;
    return raw;
  };

  useEffect(() => {
    if (user) {
      const next = getSafeNext();
      if (next) window.location.replace(next);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationResult = loginSchema.safeParse({ email, password });

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        toast({
          title: t('auth.validationFailed'),
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
          title: t('auth.loginError'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.loginSuccessDesc'),
        });
        // La session sera mise à jour automatiquement par onAuthStateChange
        // Pas besoin de recharger la page
      }
    } catch (error) {
      toast({
        title: t('auth.loginError'),
        description: t('auth.unexpectedError'),
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
        const firstError = validationResult.error.issues[0];
        toast({
          title: t('auth.validationFailed'),
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const next = getSafeNext();
      const redirectUrl = next
        ? `${window.location.origin}${next}`
        : `${window.location.origin}/`;

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
          title: t('auth.signupError'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('auth.signupSuccess'),
          description: t('auth.signupSuccessDesc'),
        });
        // Force une récupération immédiate de la session même si elle peut être nulle en cas d'email de confirmation
        await supabase.auth.getSession();
        // Recharger la page pour mettre à jour l'état de connexion
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: t('auth.signupError'),
        description: t('auth.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    window.location.href = STRIPE_PAYMENT_LINK;
  };

  const handleManageSubscription = async () => {
    setCheckoutLoading(true);
    try {
      const result = await openCustomerPortal();
      if (result.noSubscription) {
        toast({
          title: t('auth.noSubscription'),
          description: t('auth.noSubscriptionDesc'),
        });
        setCheckoutLoading(false);
        return;
      }
      if (result.url) {
        window.open(result.url, "_blank");
        toast({
          title: t('auth.portalOpenSuccess'),
          description: t('auth.portalOpenSuccessDesc'),
        });
      } else {
        throw new Error("Impossible d'ouvrir le portail client");
      }
    } catch (error) {
      toast({
        title: t('auth.portalError'),
        description: t('auth.portalErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const pricingFeatures = [
    t('auth.premiumFeatures.feature1'),
    t('auth.premiumFeatures.feature2'),
    t('auth.premiumFeatures.feature3'),
    t('auth.premiumFeatures.feature4'),
    t('auth.premiumFeatures.feature5'),
    t('auth.premiumFeatures.feature6'),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 bg-gradient-gaming bg-clip-text text-transparent">
              {t('auth.accessPremium')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('auth.createAccount')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {!user ? (
              <Card className="p-8 bg-gradient-card border-border/50 animate-slide-up">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">{t('auth.connectionTab')}</TabsTrigger>
                    <TabsTrigger value="signup">{t('auth.registrationTab')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">{t('auth.email')}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">{t('auth.password')}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder={t('auth.passwordPlaceholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? t('auth.subscriptionInProgress') : t('auth.loginButton')}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">{t('auth.name')}</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            placeholder={t('auth.namePlaceholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">{t('auth.email')}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{t('auth.password')}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder={t('auth.passwordPlaceholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? t('auth.subscriptionInProgress') : t('auth.signupButton')}
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
                  <h3 className="text-2xl font-bold mb-2">{t('auth.loggedInAs')}</h3>
                  <p className="text-muted-foreground mb-4">{user.email}</p>
                  <p className="text-sm text-muted-foreground">{t('auth.loggedInDesc')}</p>
                </div>
              </Card>
            )}

            <Card
              className="p-8 bg-gradient-card border-border/50 relative overflow-hidden animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              {isPremium ? (
              <>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-primary-foreground">
                      {isTrialing ? t('auth.trialBadge') : t('auth.activeBadge')}
                    </Badge>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-3xl font-display font-bold mb-2">{t('auth.premiumSubscription')}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-display font-bold bg-gradient-gaming bg-clip-text text-transparent">
                        14,90€
                      </span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                    {isTrialing && trialEnd && (
                      <p className="text-sm text-amber-500 mt-2 font-semibold">
                        🎁 {t('auth.trialEndsOn')} {new Date(trialEnd).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                    {!isTrialing && subscriptionStatus.subscription_end && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {t('auth.renewalDate')} {new Date(subscriptionStatus.subscription_end).toLocaleDateString("fr-FR")}
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
                    {checkoutLoading ? t('auth.openPortal') : t('auth.manageSubscription')}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">{t('auth.cancelAnytime')}</p>
                </>
              ) : (
                <>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-accent text-accent-foreground">{t('auth.popularBadge')}</Badge>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-3xl font-display font-bold mb-2">{t('auth.premiumSubscription')}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-display font-bold bg-gradient-gaming bg-clip-text text-transparent">
                        14,90€
                      </span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-semibold text-green-500">
                      🎁 {t('auth.freeTrialBadge')}
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
                  >
                    <CreditCard className="w-4 h-4" />
                    {t('auth.startFreeTrial')}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">{t('auth.trialInfo')}</p>
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
            Les prédictions sont alimentées par PredictEsport. Le système utilise une approche purement mathématique
            basée sur les statistiques historiques des joueurs et des équipes pour estimer les probabilités de victoire
            en série. Il s'agit uniquement d'un outil d'analyse et de statistiques — il n'encourage pas les paris sur
            les matchs.
          </p>
        </div>
      </footer>

      <SubscriptionErrorDialog
        open={diagnosticOpen}
        onOpenChange={setDiagnosticOpen}
        diagnostics={diagnostics}
        onRetry={handleSubscribe}
      />
    </div>
  );
};

export default Auth;
