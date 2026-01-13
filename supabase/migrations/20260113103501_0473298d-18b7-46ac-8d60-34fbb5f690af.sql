-- Add display_name column to profiles table
ALTER TABLE public.profiles ADD COLUMN display_name TEXT;

-- Update existing profiles to use email username as default display name
UPDATE public.profiles SET display_name = SPLIT_PART(email, '@', 1) WHERE display_name IS NULL AND email IS NOT NULL;