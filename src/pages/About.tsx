import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Send, Star, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import founderPhoto from "@/assets/founder.jpg";
import { SEO } from "@/components/SEO";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  content: string;
  created_at: string;
}

const StarRating = ({ rating, onRatingChange, interactive = false }: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 transition-colors ${
            (interactive ? (hoverRating || rating) : rating) >= star
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          } ${interactive ? "cursor-pointer" : ""}`}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onRatingChange?.(star)}
        />
      ))}
    </div>
  );
};

const About = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Contact form
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");

  // ROI form
  const [roiEmail, setRoiEmail] = useState("");
  const [roiLoading, setRoiLoading] = useState(false);

  // Reviews
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author_name, rating, content, created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        author_name: authorName.trim(),
        rating,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("reviews.submitSuccess"), description: t("reviews.submitSuccessDesc") });
      setAuthorName(""); setRating(5); setContent("");
    },
    onError: () => {
      toast({ title: t("reviews.submitError"), description: t("reviews.submitErrorDesc"), variant: "destructive" });
    },
  });

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

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="À propos de PredictEsport — méthodologie & contact"
        description="Découvrez l'histoire de PredictEsport, notre méthodologie IA, les avis de notre communauté et contactez-nous."
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
              Découvrez notre histoire, contactez-nous et lisez les avis de notre communauté.
            </p>

            {/* In-page nav */}
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
              <a href="#histoire" className="px-4 py-2 rounded-full bg-secondary/60 hover:bg-secondary transition">Notre histoire</a>
              <a href="#avis" className="px-4 py-2 rounded-full bg-secondary/60 hover:bg-secondary transition">Avis</a>
              <a href="#contact" className="px-4 py-2 rounded-full bg-secondary/60 hover:bg-secondary transition">Contact</a>
            </nav>
          </div>

          {/* Notre histoire (avec photo) */}
          <section id="histoire" className="bg-gradient-card border border-border/50 rounded-xl p-6 sm:p-8 mb-12 scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-6 text-center">{t('about.story.title')}</h2>
            <div className="grid md:grid-cols-[200px_1fr] gap-6 items-start">
              <div className="mx-auto md:mx-0">
                <img
                  src={founderPhoto}
                  alt="Fondateur de PredictEsport, créateur de l'algorithme de prédictions esport"
                  className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl object-cover border-2 border-primary/30 shadow-elegant"
                  loading="lazy"
                />
                <p className="text-xs text-muted-foreground text-center mt-2">Le fondateur</p>
              </div>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>{t('about.story.text1')}</p>
                <p>{t('about.story.text2')}</p>
                <p>{t('about.story.text3')}</p>
                <p className="italic">{t('about.story.text4')}</p>
              </div>
            </div>
          </section>

          {/* Lien vers la page résultats */}
          <section className="mb-12">
            <div className="bg-gradient-card border border-border/50 rounded-xl p-6 sm:p-8 text-center">
              <h2 className="text-2xl font-display font-bold mb-3">Découvrez nos résultats</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Performances détaillées de notre algorithme de Machine Learning, métriques de précision et ROI réel.
              </p>
              <Link to="/results">
                <Button size="lg" variant="default">Voir nos résultats & performances</Button>
              </Link>
            </div>
          </section>

          {/* Avis */}
          <section id="avis" className="mb-12 scroll-mt-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">{t("reviews.title")}</h2>
              <p className="text-muted-foreground">{t("reviews.subtitle")}</p>
              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{averageRating}</div>
                  <StarRating rating={Math.round(Number(averageRating))} />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{reviews.length}</div>
                  <div className="text-sm text-muted-foreground">{t("reviews.totalReviews")}</div>
                </div>
              </div>
            </div>

            <Card className="p-6 mb-6 bg-gradient-card border-border/50">
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                {t("reviews.leaveReview")}
              </h3>
              {user ? (
                <form onSubmit={(e) => { e.preventDefault(); if (authorName.trim() && content.trim()) submitReview.mutate(); }} className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">{t("reviews.yourName")}</Label>
                    <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder={t("reviews.namePlaceholder")} maxLength={50} required className="bg-background/50" />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">{t("reviews.yourRating")}</Label>
                    <StarRating rating={rating} onRatingChange={setRating} interactive />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">{t("reviews.yourReview")}</Label>
                    <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("reviews.reviewPlaceholder")} maxLength={500} rows={4} required className="bg-background/50" />
                  </div>
                  <Button type="submit" disabled={submitReview.isPending || !authorName.trim() || !content.trim()}>
                    {submitReview.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("reviews.submitting")}</>) : t("reviews.submit")}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">{t("reviews.loginRequired")}</p>
                  <Link to="/auth"><Button>{t("nav.login")}</Button></Link>
                </div>
              )}
            </Card>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reviews.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-card border-border/50">
                <p className="text-muted-foreground">{t("reviews.noReviews")}</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-6 bg-gradient-card border-border/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{review.author_name}</h4>
                        <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{review.content}</p>
                  </Card>
                ))}
              </div>
            )}
          </section>

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
