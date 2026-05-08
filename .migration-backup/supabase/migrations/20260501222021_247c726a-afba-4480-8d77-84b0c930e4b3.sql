CREATE TABLE public.companion_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_key TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companion_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own companion messages"
ON public.companion_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create own companion messages"
ON public.companion_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own companion messages"
ON public.companion_messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_companion_messages_user_book ON public.companion_messages(user_id, book_key, created_at);