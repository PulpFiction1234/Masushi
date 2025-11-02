-- Adds optional birthday field to profiles for birthday discount eligibility
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birthday DATE;

CREATE INDEX IF NOT EXISTS idx_profiles_birthday ON public.profiles(birthday);
