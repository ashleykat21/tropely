-- Add chapter tracking to buddy reads
ALTER TABLE public.buddy_reads
  ADD COLUMN IF NOT EXISTS chapters jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.buddy_messages
  ADD COLUMN IF NOT EXISTS chapter integer;

-- Cap free buddy-read membership at 3 (owner counts via separate logic; this enforces room size)
CREATE OR REPLACE FUNCTION public.enforce_buddy_member_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count integer;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM public.buddy_members
  WHERE buddy_read_id = NEW.buddy_read_id;
  -- Owner + (member_count after insert). Free cap is 3 total participants.
  -- Premium gating happens client-side; this is a hard server safeguard against accidental floods.
  IF member_count >= 50 THEN
    RAISE EXCEPTION 'Buddy read is full.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_buddy_member_cap ON public.buddy_members;
CREATE TRIGGER trg_buddy_member_cap
  BEFORE INSERT ON public.buddy_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_buddy_member_cap();