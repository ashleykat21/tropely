CREATE TABLE public.taste_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  favorite_moods text[] NOT NULL DEFAULT '{}',
  avoid_moods text[] NOT NULL DEFAULT '{}',
  top_emojis text[] NOT NULL DEFAULT '{}',
  top_genres text[] NOT NULL DEFAULT '{}',
  favorite_books jsonb NOT NULL DEFAULT '[]'::jsonb,
  finished_titles text[] NOT NULL DEFAULT '{}',
  pace text,
  age_band text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.taste_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Taste profiles viewable by authenticated"
  ON public.taste_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users insert own taste profile"
  ON public.taste_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own taste profile"
  ON public.taste_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own taste profile"
  ON public.taste_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_taste_profiles_updated_at
  BEFORE UPDATE ON public.taste_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_taste_profiles_user_id ON public.taste_profiles(user_id);