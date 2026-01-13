import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

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

const Reviews = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  // Fetch approved reviews
  const { data: reviews = [], isLoading } = useQuery({
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

  // Submit review mutation
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
      toast({
        title: t("reviews.submitSuccess"),
        description: t("reviews.submitSuccessDesc"),
      });
      setAuthorName("");
      setRating(5);
      setContent("");
    },
    onError: () => {
      toast({
        title: t("reviews.submitError"),
        description: t("reviews.submitErrorDesc"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;
    submitReview.mutate();
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-6 bg-gradient-gaming bg-clip-text text-transparent">
              {t("reviews.title")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              {t("reviews.subtitle")}
            </p>
            
            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{averageRating}</div>
                <div className="flex items-center justify-center gap-1">
                  <StarRating rating={Math.round(Number(averageRating))} />
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{reviews.length}</div>
                <div className="text-sm text-muted-foreground">{t("reviews.totalReviews")}</div>
              </div>
            </div>
          </div>

          {/* Submit Review Form */}
          <Card className="p-6 mb-10 bg-gradient-card border-border/50 animate-slide-up">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {t("reviews.leaveReview")}
            </h2>
            
            {user ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("reviews.yourName")}</label>
                  <Input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={t("reviews.namePlaceholder")}
                    maxLength={50}
                    required
                    className="bg-background/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t("reviews.yourRating")}</label>
                  <StarRating rating={rating} onRatingChange={setRating} interactive />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t("reviews.yourReview")}</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("reviews.reviewPlaceholder")}
                    maxLength={500}
                    rows={4}
                    required
                    className="bg-background/50"
                  />
                </div>
                
                <Button type="submit" disabled={submitReview.isPending || !authorName.trim() || !content.trim()}>
                  {submitReview.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("reviews.submitting")}
                    </>
                  ) : (
                    t("reviews.submit")
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">{t("reviews.loginRequired")}</p>
                <Link to="/auth">
                  <Button>{t("nav.login")}</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold">{t("reviews.allReviews")}</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reviews.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-card border-border/50">
                <p className="text-muted-foreground">{t("reviews.noReviews")}</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {reviews.map((review, index) => (
                  <Card 
                    key={review.id} 
                    className="p-6 bg-gradient-card border-border/50 hover:border-primary/30 transition-all animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{review.author_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{review.content}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PredictEsport. {t("about.footer.rights")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Reviews;
