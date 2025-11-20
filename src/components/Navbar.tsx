import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, User, LogOut, CreditCard, ExternalLink, AlertTriangle, Menu } from "lucide-react";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { openCustomerPortal } from "@/lib/subscription";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./LanguageSelector";
import { useIsMobile } from "@/hooks/use-mobile";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const games = [
    { id: "lol", name: t('nav.games.lol'), path: "/", active: true },
    { id: "cs2", name: t('nav.games.cs2'), path: "/cs2", active: false },
    { id: "dota2", name: t('nav.games.dota2'), path: "/dota2", active: false },
  ];

  const handleLogout = async () => {
    console.log("[Navbar] Logout initiated");
    
    try {
      // Nettoyer d'abord le localStorage
      localStorage.clear();
      console.log("[Navbar] localStorage cleared");

      // Puis se déconnecter
      await supabase.auth.signOut();
      console.log("[Navbar] signOut completed");

      // Redirection immédiate
      window.location.replace('/auth');
    } catch (error) {
      console.error("[Navbar] Logout error:", error);
      // Forcer la redirection même si erreur
      window.location.replace('/auth');
    }
  };

  const handleLogoutAll = async () => {
    try {
      console.log("[Navbar] Logging out from all devices...");
      console.log("[Navbar] Clearing localStorage...");
      localStorage.clear();
      console.log("[Navbar] Calling global signOut...");
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("[Navbar] Global logout error:", error);
        toast({
          title: "Erreur",
          description: "Impossible de se déconnecter",
          variant: "destructive",
        });
        return;
      }

      console.log("[Navbar] Global signOut success");
      toast({
        title: "Déconnecté de tous les appareils",
        description: "Vous avez été déconnecté de toutes vos sessions",
      });

      setShowLogoutAllDialog(false);
      
      console.log("[Navbar] Redirecting to /auth...");
      // Utiliser replace pour forcer un rechargement complet
      window.location.replace('/auth');
    } catch (e) {
      console.error("[Navbar] Global logout exception:", e);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
      setTimeout(() => window.location.replace('/auth'), 500);
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
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary transition-transform group-hover:scale-110" />
              <span className="font-display text-lg sm:text-2xl font-bold bg-gradient-gaming bg-clip-text text-transparent">
                PredictEsport
              </span>
            </Link>
            {user && (
              <Badge variant={isPremium ? "default" : "secondary"} className="gap-1 text-xs sm:text-sm">
                {isPremium ? (
                  <>
                    <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden xs:inline">Premium</span>
                  </>
                ) : (
                  <span className="hidden xs:inline">Free</span>
                )}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu */}
            {isMobile && (
              <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>{t('nav.menu')}</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6 space-y-4">
                    {/* Games */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{t('nav.games.title')}</p>
                      {games.map((game) => (
                        <DrawerClose asChild key={game.id}>
                          <Link
                            to={game.path}
                            className={`block px-3 py-2 rounded-md text-sm font-medium transition-all ${
                              location.pathname === game.path
                                ? "bg-primary text-primary-foreground"
                                : game.active
                                ? "text-foreground hover:bg-secondary"
                                : "text-muted-foreground cursor-not-allowed opacity-50"
                            }`}
                            onClick={(e) => {
                              if (!game.active) e.preventDefault();
                              else setMobileMenuOpen(false);
                            }}
                          >
                            {game.name}
                          </Link>
                        </DrawerClose>
                      ))}
                    </div>

                    {/* Pages */}
                    <div className="space-y-2">
                      <DrawerClose asChild>
                        <Link to="/about" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
                          {t('nav.results')}
                        </Link>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Link to="/contact" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
                          {t('nav.contact')}
                        </Link>
                      </DrawerClose>
                    </div>

                    {/* Language Selector */}
                    <div className="pt-2 border-t">
                      <LanguageSelector />
                    </div>

                    {/* User Actions */}
                    <div className="pt-2 border-t space-y-2">
                      {user ? (
                        <>
                          {isPremium ? (
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { handleOpenPortal(); setMobileMenuOpen(false); }}>
                              <ExternalLink className="w-4 h-4" />
                              {t('nav.manageSubscription')}
                            </Button>
                          ) : (
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                              <CreditCard className="w-4 h-4" />
                              {t('nav.subscribePremium')}
                            </Button>
                          )}
                          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                            <LogOut className="w-4 h-4" />
                            {t('nav.logout')}
                          </Button>
                          <Button variant="outline" className="w-full justify-start gap-2 text-destructive" onClick={() => { setShowLogoutAllDialog(true); setMobileMenuOpen(false); }}>
                            <AlertTriangle className="w-4 h-4" />
                            {t('nav.logoutAll')}
                          </Button>
                        </>
                      ) : (
                        <DrawerClose asChild>
                          <Button variant="default" className="w-full gap-2" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                            <User className="w-4 h-4" />
                            {t('nav.login')}
                          </Button>
                        </DrawerClose>
                      )}
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            )}

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 sm:gap-4 md:gap-6">
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                {games.map((game) => (
                  <Link
                    key={game.id}
                    to={game.path}
                    className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
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

              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/about">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                    {t('nav.results')}
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                    {t('nav.contact')}
                  </Button>
                </Link>
                
                <LanguageSelector />
                
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline max-w-[80px] lg:max-w-none truncate">{user.email?.split('@')[0]}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isPremium ? (
                        <DropdownMenuItem onClick={handleOpenPortal} className="gap-2 cursor-pointer">
                          <ExternalLink className="w-4 h-4" />
                          {t('nav.manageSubscription')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => navigate('/auth')} className="gap-2 cursor-pointer">
                          <CreditCard className="w-4 h-4" />
                          {t('nav.subscribePremium')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer">
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setShowLogoutAllDialog(true)} 
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        {t('nav.logoutAll')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/auth">
                    <Button variant="default" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t('nav.login')}</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('nav.logoutAllTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('nav.logoutAllDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('nav.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogoutAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('nav.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
};
