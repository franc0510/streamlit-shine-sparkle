import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

const About = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Contact form
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");

  // ROI form
  const [roiEmail, setRoiEmail] = useState("");
  const [roiLoading, setRoiLoading] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/functions/v1/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: contactEmail, message }),
      });
      if (!response.ok) throw new Error('Failed to send email');
      toast({ title: t('contact.form.successTitle'), description: t('contact.form.successDescription') });
      setName(""); setContactEmail(""); setMessage("");
    } catch {
      toast({ title: t('contact.form.errorTitle'), description: t('contact.form.errorDescription'), variant: "destructive" });
    }
  };

  const handleRoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoiLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-roi-results', { body: { email: roiEmail } });
      if (error) throw error;
      toast({ title: t('about.roi.successTitle'), description: t('about.roi.successDescription') });
      setRoiEmail("");
    } catch {
      toast({ title: t('about.roi.errorTitle'), description: t('about.roi.errorDescription'), variant: "destructive" });
    } finally {
      setRoiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="À propos de PredictEsport — méthodologie & contact"
        description="Contactez l'équipe PredictEsport pour accéder à nos probabilités, cotes et jeux de données esport."
        path="/about"
      />
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 bg-gradient-gaming bg-clip-text text-transparent">
              À propos de PredictEsport
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Une question, un besoin en données ? Contactez l'équipe.
            </p>

            {/* In-page nav */}
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
              <a href="#contact" className="px-4 py-2 rounded-full bg-secondary/60 hover:bg-secondary transition">Contact</a>
            </nav>
          </div>

          {/* Contact */}
          <section id="contact" className="mb-12 scroll-mt-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">{t('contact.title')}</h2>
              <p className="text-muted-foreground">{t('contact.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="p-5 bg-gradient-card border-border/50 text-center">
                <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-display font-bold mb-1">{t('contact.email')}</h3>
                <p className="text-xs text-muted-foreground break-all">predictesport.contact@gmail.com</p>
              </Card>
              <Card className="p-5 bg-gradient-card border-border/50 text-center">
                <svg className="w-8 h-8 text-primary mx-auto mb-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/></svg>
                <h3 className="font-display font-bold mb-1">{t('contact.discord')}</h3>
                <a href="https://discord.gg/7vwFPPcmwc" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">discord.gg/7vwFPPcmwc</a>
              </Card>
              <Card className="p-5 bg-gradient-card border-border/50 text-center">
                <MessageSquare className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-display font-bold mb-1">{t('contact.support')}</h3>
                <p className="text-xs text-muted-foreground">{t('contact.supportDesc')}</p>
              </Card>
            </div>

            <Card className="p-6 sm:p-8 bg-gradient-card border-border/50">
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.form.name')}</Label>
                    <Input id="name" placeholder={t('contact.form.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.form.email')}</Label>
                    <Input id="email" type="email" placeholder={t('contact.form.emailPlaceholder')} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required className="bg-background/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact.form.message')}</Label>
                  <Textarea id="message" placeholder={t('contact.form.messagePlaceholder')} value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} className="bg-background/50 resize-none" />
                </div>
                <Button type="submit" size="lg" className="w-full gap-2">
                  <Send className="w-4 h-4" />
                  {t('contact.form.send')}
                </Button>
              </form>
            </Card>
          </section>
        </div>
      </main>

      <footer className="border-t border-border mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PredictEsport. {t('about.footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
