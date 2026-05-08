CREATE TABLE public.reading_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_key text NOT NULL,
  book_title text NOT NULL,
  page integer NOT NULL DEFAULT 0,
  total_pages integer,
  device_label text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_key)
);

ALTER TABLE public.reading_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own positions"
  ON public.reading_positions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own positions"
  ON public.reading_positions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own positions"
  ON public.reading_positions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own positions"
  ON public.reading_positions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_reading_positions_user ON public.reading_positions (user_id, updated_at DESC);

CREATE TRIGGER update_reading_positions_updated_at
BEFORE UPDATE ON public.reading_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();