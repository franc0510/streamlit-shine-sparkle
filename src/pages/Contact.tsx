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

const Contact = () => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/functions/v1/send-contact-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast({
        title: t('contact.form.successTitle'),
        description: t('contact.form.successDescription'),
      });
      
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      toast({
        title: t('contact.form.errorTitle'),
        description: t('contact.form.errorDescription'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-6 bg-gradient-gaming bg-clip-text text-transparent">
              {t('contact.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 bg-gradient-card border-border/50 text-center hover:border-primary/50 transition-all animate-slide-up">
              <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-display font-bold mb-2">{t('contact.email')}</h3>
              <p className="text-sm text-muted-foreground">predictesport.contact@gmail.com</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <svg className="w-10 h-10 text-primary mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <h3 className="font-display font-bold mb-2">{t('contact.discord')}</h3>
              <a href="https://discord.gg/7vwFPPcmwc" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                discord.gg/7vwFPPcmwc
              </a>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 text-center hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <MessageSquare className="w-10 h-10 text-accent mx-auto mb-4" />
              <h3 className="font-display font-bold mb-2">{t('contact.support')}</h3>
              <p className="text-sm text-muted-foreground">{t('contact.supportDesc')}</p>
            </Card>

          </div>

          <Card className="p-8 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('contact.form.name')}</Label>
                  <Input
                    id="name"
                    placeholder={t('contact.form.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('contact.form.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('contact.form.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t('contact.form.message')}</Label>
                <Textarea
                  id="message"
                  placeholder={t('contact.form.messagePlaceholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="bg-background/50 border-border/50 focus:border-primary resize-none"
                />
              </div>

              <Button type="submit" size="lg" className="w-full gap-2">
                <Send className="w-4 h-4" />
                {t('contact.form.send')}
              </Button>
            </form>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PredictEsport. {t('about.footer.rights')}</p>
          <p className="mt-2 text-xs max-w-3xl mx-auto">
            {t('about.footer.disclaimer')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
