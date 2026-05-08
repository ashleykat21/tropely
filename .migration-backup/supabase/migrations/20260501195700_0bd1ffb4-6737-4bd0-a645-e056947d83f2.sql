CREATE TABLE public.subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  stripe_customer_id text,
  subscribed boolean NOT NULL DEFAULT false,
  tier text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.subscribers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_subscribers_stripe_customer ON public.subscribers(stripe_customer_id);