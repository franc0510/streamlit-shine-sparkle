import { Navbar } from "@/components/Navbar";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

const CS2 = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted/20 mb-6 sm:mb-8">
            <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-4 sm:mb-6 text-muted-foreground/50">
            {t('comingSoon.cs2.title')}
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
            {t('comingSoon.cs2.subtitle')}
          </p>
          
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            {t('comingSoon.cs2.description')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default CS2;
