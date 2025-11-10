import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, User, LogOut, CreditCard, ExternalLink, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { openCustomerPortal } from "@/lib/subscription";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

const games = [
  { id: "lol", name: "League of Legends", path: "/", active: true },
  { id: "cs2", name: "CS2", path: "/cs2", active: false },
  { id: "dota2", name: "DOTA 2", path: "/dota2", active: false },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);

  const handleLogout = async () => {
    try {
      console.log("[Navbar] Logging out...");
      // Sign out global pour révoquer les refresh tokens
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.warn("[Navbar] signOut error:", error);
      }
    } catch (e) {
      console.warn("[Navbar] signOut threw:", e);
    } finally {
      // Purge totale des tokens (localStorage + sessionStorage)
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        console.warn('[Navbar] storage clear error:', err);
      }

      toast({
        title: "Déconnecté",
        description: "À bientôt sur PredictEsport",
      });

      // Redirection + reload dur pour vider l'état en mémoire et l'URL
      try {
        window.history.replaceState({}, '', '/auth');
      } catch {}
      window.location.reload();
    }
  };

  const handleLogoutAll = async () => {
    try {
      console.log("[Navbar] Logging out from all devices...");
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.warn("[Navbar] global signOut error:", error);
      }
    } catch (e) {
      console.warn("[Navbar] global signOut threw:", e);
    } finally {
      // Purge totale des tokens
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        console.warn('[Navbar] storage clear error:', err);
      }

      toast({
        title: "Déconnecté de tous les appareils",
        description: "Vous avez été déconnecté de toutes vos sessions",
      });

      try {
        window.history.replaceState({}, '', '/auth');
      } catch {}
      window.location.reload();
    }
  };


  const handleOpenPortal = async () => {
    try {
      const url = await openCustomerPortal();
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('No portal URL');
      }
    } catch (e) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le portail client",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <Gamepad2 className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
              <span className="font-display text-2xl font-bold bg-gradient-gaming bg-clip-text text-transparent">
                PredictEsport
              </span>
            </Link>
            {user && (
              <Badge variant={isPremium ? "default" : "secondary"} className="gap-1">
                {isPremium ? (
                  <>
                    <Crown className="w-3 h-3" />
                    Premium
                  </>
                ) : (
                  "Free"
                )}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
              {games.map((game) => (
                <Link
                  key={game.id}
                  to={game.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    location.pathname === game.path
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : game.active
                      ? "text-foreground hover:bg-secondary"
                      : "text-muted-foreground cursor-not-allowed opacity-50"
                  }`}
                  onClick={(e) => !game.active && e.preventDefault()}
                >
                  {game.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link to="/about">
                <Button variant="ghost" size="sm">
                  À propos
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="ghost" size="sm">
                  Contact
                </Button>
              </Link>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      {user.email?.split('@')[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isPremium ? (
                      <DropdownMenuItem onClick={handleOpenPortal} className="gap-2 cursor-pointer">
                        <ExternalLink className="w-4 h-4" />
                        Gérer mon abonnement
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => navigate('/auth')} className="gap-2 cursor-pointer">
                        <CreditCard className="w-4 h-4" />
                        S'abonner Premium
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer">
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowLogoutAllDialog(true)} 
                      className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Se déconnecter partout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="default" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    Connexion
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Se déconnecter de tous les appareils ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action révoquera toutes vos sessions actives sur tous vos appareils.
              Vous devrez vous reconnecter partout où vous utilisez PredictEsport.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogoutAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmer la déconnexion globale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
};
