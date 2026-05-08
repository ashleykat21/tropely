
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read follows"
ON public.follows FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users follow as themselves"
ON public.follows FOR INSERT TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users unfollow themselves"
ON public.follows FOR DELETE TO authenticated
USING (auth.uid() = follower_id);
