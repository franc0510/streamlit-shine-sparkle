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
import { useTr } from "@/hooks/useTr";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const { tr } = useTr();

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

  const links = [
    { to: "/#produits", label: tr("Produits", "Products") },
    { to: "/#couverture", label: tr("Couverture", "Coverage") },
    { to: "/track-record", label: "Track record" },
    { to: "/labs", label: "Labs" },
    { to: "/cs2", label: "CS2", badge: "test" },
    { to: "/pricing", label: tr("Tarifs", "Pricing") },
  ];
  const isActive = (to: string) => !to.includes("#") && location.pathname === to;

  const AccountMenu = () =>
    user ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden max-w-[110px] truncate sm:inline">{user.email?.split("@")[0]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate("/predictions")} className="cursor-pointer">{tr("Prédictions du jour", "Today's predictions")}</DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenPortal} className="cursor-pointer gap-2"><ExternalLink className="h-4 w-4" />{t("nav.manageSubscription")}</DropdownMenuItem>
          {!isPremium && <DropdownMenuItem onClick={() => navigate("/pricing")} className="cursor-pointer gap-2"><CreditCard className="h-4 w-4" />{t("nav.subscribePremium")}</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2"><LogOut className="h-4 w-4" />{t("nav.logout")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Link to="/auth"><Button variant="ghost" size="sm">{t("nav.login")}</Button></Link>
    );

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-gaming"><Gamepad2 className="h-4.5 w-4.5 h-[18px] w-[18px] text-background" /></span>
            <span className="font-display text-lg font-bold tracking-tight">PredictEsport</span>
          </Link>
          {!isMobile && (
            <div className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive(l.to) ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {l.label}
                  {l.badge && <span className="ml-1.5 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">{l.badge}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          {!isMobile && <AccountMenu />}
          {!isMobile && <Link to="/about#contact"><Button size="sm">{tr("Contacter l'équipe", "Contact sales")}</Button></Link>}
          {isMobile && (
            <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DrawerTrigger asChild><Button variant="ghost" size="sm" aria-label="Menu"><Menu className="h-5 w-5" /></Button></DrawerTrigger>
              <DrawerContent>
                <DrawerHeader><DrawerTitle>{t("nav.menu")}</DrawerTitle></DrawerHeader>
                <div className="space-y-1 px-4 pb-6">
                  {links.map((l) => (
                    <DrawerClose asChild key={l.to}>
                      <Link to={l.to} className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>{l.label}</Link>
                    </DrawerClose>
                  ))}
                  <DrawerClose asChild>
                    <Link to="/predictions" className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary">{tr("Prédictions du jour", "Today's predictions")}</Link>
                  </DrawerClose>
                  <div className="flex items-center gap-2 border-t border-border pt-4">
                    <AccountMenu />
                    <DrawerClose asChild><Link to="/about#contact" className="flex-1"><Button className="w-full">{tr("Contacter l'équipe", "Contact sales")}</Button></Link></DrawerClose>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
      </div>
    </nav>
  );
};
