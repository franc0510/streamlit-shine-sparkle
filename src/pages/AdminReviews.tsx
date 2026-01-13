import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Loader2, Check, X, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  content: string;
  created_at: string;
  user_id: string;
}

const ADMIN_EMAILS = ["ludoprs13@gmail.com", "gillot33@gmail.com"];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-4 h-4 ${
          rating >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        }`}
      />
    ))}
  </div>
);

const AdminReviews = () => {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  // Check admin access
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  // Fetch pending reviews
  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-reviews", {
        body: { action: "list" },
      });
      
      if (error) throw error;
      return data.reviews as Review[];
    },
    enabled: isAdmin,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.functions.invoke("admin-reviews", {
        body: { action: "approve", reviewId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Avis approuvé", description: "L'avis est maintenant visible." });
      refetch();
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.functions.invoke("admin-reviews", {
        body: { action: "delete", reviewId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Avis supprimé" });
      refetch();
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display font-bold">Administration des Avis</h1>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <Card className="p-8 text-center bg-gradient-card border-border/50">
              <p className="text-muted-foreground">Aucun avis en attente d'approbation.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">{reviews.length} avis en attente</p>
              
              {reviews.map((review) => (
                <Card key={review.id} className="p-6 bg-gradient-card border-border/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{review.author_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleString()}
                      </p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{review.content}</p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(review.id)}
                      disabled={approveMutation.isPending}
                      className="gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(review.id)}
                      disabled={deleteMutation.isPending}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminReviews;
