-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Has-active-subscription helper. Lifetime purchases store status='active'
-- with current_period_end = NULL; recurring rows have a real period end.
-- Canceled-but-still-in-period rows keep access until current_period_end.
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'sandbox'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active', 'trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end IS NOT NULL AND current_period_end > now())
      )
  );
$$;

-- Daily Companion usage (free-tier rate limit)
CREATE TABLE public.companion_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  usage_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

CREATE INDEX idx_companion_usage_user_date ON public.companion_usage(user_id, usage_date);

ALTER TABLE public.companion_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage"
  ON public.companion_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages usage"
  ON public.companion_usage FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_companion_usage_updated_at
  BEFORE UPDATE ON public.companion_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();