-- Privacy controls: blocked users + per-activity privacy + private profile flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

ALTER TABLE public.activity
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
-- visibility: 'public' | 'followers' | 'private'

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own blocks"
  ON public.blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users create own blocks"
  ON public.blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users delete own blocks"
  ON public.blocked_users FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Allow users to insert notifications for themselves (for client-side reminders)
DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);