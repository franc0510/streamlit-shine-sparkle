import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Landing from "./pages/Landing";
import "./i18n/config";

// Routes secondaires chargées à la demande (code-splitting) pour alléger
// le bundle initial et accélérer le premier rendu de l'accueil.
const About = lazy(() => import("./pages/About"));
const Index = lazy(() => import("./pages/Index"));
const TrackRecord = lazy(() => import("./pages/TrackRecord"));
const Labs = lazy(() => import("./pages/Labs"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Auth = lazy(() => import("./pages/Auth"));
const CS2 = lazy(() => import("./pages/CS2"));
const Dota2 = lazy(() => import("./pages/Dota2"));
const MatchDetails = lazy(() => import("./pages/MatchDetails"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Fait défiler jusqu'à l'ancre (#verification…) après la navigation, et remonte en haut sinon.
const ScrollManager = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    const t = setTimeout(() => { const el = document.getElementById(hash.slice(1)); el ? el.scrollIntoView({ behavior: "smooth" }) : window.scrollTo(0, 0); }, 150);
    return () => clearTimeout(t);
  }, [pathname, hash]);
  return null;
};

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollManager />
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/predictions" element={<Index />} />
                  <Route path="/track-record" element={<TrackRecord />} />
                  <Route path="/labs" element={<Labs />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/results" element={<Navigate to="/track-record" replace />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/contact" element={<Navigate to="/about#contact" replace />} />
                  <Route path="/reviews" element={<Navigate to="/about#avis" replace />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/cs2" element={<CS2 />} />
                  <Route path="/dota2" element={<Dota2 />} />
                  <Route path="/admin/reviews" element={<AdminReviews />} />
                  <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                  {/* Match details route */}
                  <Route path="/match/:tournament/:date/:time/:team1_vs_team2" element={<MatchDetails />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SubscriptionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
