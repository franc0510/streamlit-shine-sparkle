import { Navbar } from "@/components/Navbar";
import { Lock, Gamepad2, Target, Trophy, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

const CS2 = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section with Glow Effect */}
          <div className="relative mb-8 sm:mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-yellow-500/20 blur-3xl rounded-full" />
            <div className="relative inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/30 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 animate-pulse">
              <Target className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-orange-400" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
            {t('comingSoon.cs2.title')}
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10 px-4">
            {t('comingSoon.cs2.subtitle')}
          </p>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="bg-gradient-card border border-orange-500/20 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t('comingSoon.features.aiPredictions')}</h3>
              <p className="text-sm text-muted-foreground">{t('comingSoon.features.aiPredictionsDesc')}</p>
            </div>
            
            <div className="bg-gradient-card border border-orange-500/20 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t('comingSoon.features.tournaments')}</h3>
              <p className="text-sm text-muted-foreground">{t('comingSoon.features.tournamentsDesc')}</p>
            </div>
            
            <div className="bg-gradient-card border border-orange-500/20 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t('comingSoon.features.realtime')}</h3>
              <p className="text-sm text-muted-foreground">{t('comingSoon.features.realtimeDesc')}</p>
            </div>
          </div>
          
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-full px-6 py-3">
            <Lock className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-semibold text-orange-300">
              {t('comingSoon.cs2.description')}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CS2;
