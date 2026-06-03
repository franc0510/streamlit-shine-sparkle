import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, User, LogOut, CreditCard, ExternalLink, Menu } from "lucide-react";
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



  const handleOpenPortal = async () => {
    try {
      const result = await openCustomerPortal();
      if (result.noSubscription) {
        // User has no subscription, redirect to subscription page
        navigate('/auth');
        toast({
          title: "Pas d'abonnement",
          description: "Vous devez d'abord souscrire à un abonnement",
        });
        return;
      }
      if (result.url) {
        window.open(result.url, '_blank');
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
                  <Button variant="ghost" size="sm" className="md:hidden" aria-label="Menu">
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
                        <Link to="/results" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
                          {t('nav.results')}
                        </Link>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Link to="/pricing" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
                          {t('nav.subscription')}
                        </Link>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Link to="/about" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
                          {t('nav.about')}
                        </Link>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Link to="/about#avis" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
                          {t('nav.reviews')}
                        </Link>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Link to="/about#contact" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
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
                          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { handleOpenPortal(); setMobileMenuOpen(false); }}>
                            <ExternalLink className="w-4 h-4" />
                            {t('nav.manageSubscription')}
                          </Button>
                          {!isPremium && (
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}>
                              <CreditCard className="w-4 h-4" />
                              {t('nav.subscribePremium')}
                            </Button>
                          )}
                          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                            <LogOut className="w-4 h-4" />
                            {t('nav.logout')}
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
                <Link to="/results">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                    {t('nav.results')}
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                    {t('nav.subscription')}
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                      {t('nav.about')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/about')} className="cursor-pointer">
                      {t('nav.about')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/about#avis')} className="cursor-pointer">
                      {t('nav.reviews')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/about#contact')} className="cursor-pointer">
                      {t('nav.contact')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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
                      <DropdownMenuItem onClick={handleOpenPortal} className="gap-2 cursor-pointer">
                        <ExternalLink className="w-4 h-4" />
                        {t('nav.manageSubscription')}
                      </DropdownMenuItem>
                      {!isPremium && (
                        <DropdownMenuItem onClick={() => navigate('/pricing')} className="gap-2 cursor-pointer">
                          <CreditCard className="w-4 h-4" />
                          {t('nav.subscribePremium')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer">
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout')}
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
    </nav>
  );
};
