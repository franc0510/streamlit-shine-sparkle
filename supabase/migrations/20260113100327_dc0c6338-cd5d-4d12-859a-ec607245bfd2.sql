-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (is_approved = true);

-- Authenticated users can insert their own reviews
CREATE POLICY "Authenticated users can insert reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own reviews (even unapproved)
CREATE POLICY "Users can view their own reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert some initial approved reviews
INSERT INTO public.reviews (user_id, author_name, rating, content, is_approved) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Thomas D.', 5, 'Service excellent ! Les prédictions sont très précises et m''ont aidé à faire de meilleurs paris. Je recommande vivement.', true),
  ('00000000-0000-0000-0000-000000000002', 'Marie L.', 5, 'Enfin un site sérieux avec des analyses de qualité. L''interface est claire et les stats sont très utiles.', true),
  ('00000000-0000-0000-0000-000000000003', 'Lucas M.', 4, 'Très bon outil pour suivre les matchs CS2 et Dota 2. Les probabilités sont fiables.', true),
  ('00000000-0000-0000-0000-000000000004', 'Sophie B.', 5, 'Je suis abonnée premium depuis 3 mois et je ne regrette pas ! Les analyses détaillées font vraiment la différence.', true),
  ('00000000-0000-0000-0000-000000000005', 'Antoine R.', 5, 'Super site, très professionnel. Les mises à jour quotidiennes sont un vrai plus.', true);