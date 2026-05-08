
CREATE TABLE public.buddy_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buddy_read_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  page_at integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_buddy_messages_room ON public.buddy_messages(buddy_read_id, created_at);

ALTER TABLE public.buddy_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read messages"
ON public.buddy_messages FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.buddy_members m
    WHERE m.buddy_read_id = buddy_messages.buddy_read_id AND m.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.buddy_reads r
    WHERE r.id = buddy_messages.buddy_read_id AND r.owner_id = auth.uid())
);

CREATE POLICY "Members post messages"
ON public.buddy_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM public.buddy_members m
      WHERE m.buddy_read_id = buddy_messages.buddy_read_id AND m.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.buddy_reads r
      WHERE r.id = buddy_messages.buddy_read_id AND r.owner_id = auth.uid())
  )
);

CREATE POLICY "Authors delete messages"
ON public.buddy_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.buddy_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buddy_members;
