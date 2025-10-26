-- Create premium_users table for manual premium access
CREATE TABLE public.premium_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.premium_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own premium status
CREATE POLICY "Users can view their own premium status"
ON public.premium_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Only service role can insert/update/delete
CREATE POLICY "Service role can manage premium users"
ON public.premium_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Insert gillot33 as premium user
INSERT INTO public.premium_users (user_id, granted_by, notes)
VALUES ('021eca21-5483-4612-bd40-9e1306bb8747', 'admin', 'Manual premium access granted');

-- Create index for faster lookups
CREATE INDEX idx_premium_users_user_id ON public.premium_users(user_id);