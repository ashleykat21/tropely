
CREATE TABLE public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  environment text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages webhook events"
  ON public.stripe_webhook_events
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_stripe_webhook_events_processed_at
  ON public.stripe_webhook_events(processed_at DESC);
