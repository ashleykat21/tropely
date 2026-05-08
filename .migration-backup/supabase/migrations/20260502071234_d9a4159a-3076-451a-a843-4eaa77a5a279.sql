-- Helper: is the caller a member of this buddy read?
CREATE OR REPLACE FUNCTION public.is_buddy_member(_buddy_read_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.buddy_members
    WHERE buddy_read_id = _buddy_read_id AND user_id = _user_id
  );
$$;

-- Helper: is the caller the owner of this buddy read?
CREATE OR REPLACE FUNCTION public.is_buddy_owner(_buddy_read_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.buddy_reads
    WHERE id = _buddy_read_id AND owner_id = _user_id
  );
$$;

-- Rewrite buddy_reads SELECT policy
DROP POLICY IF EXISTS "Buddy reads viewable by members" ON public.buddy_reads;
CREATE POLICY "Buddy reads viewable by members"
ON public.buddy_reads
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR public.is_buddy_member(id, auth.uid())
);

-- Rewrite buddy_members SELECT policy
DROP POLICY IF EXISTS "Members view co-members" ON public.buddy_members;
CREATE POLICY "Members view co-members"
ON public.buddy_members
FOR SELECT
TO authenticated
USING (
  public.is_buddy_member(buddy_read_id, auth.uid())
  OR public.is_buddy_owner(buddy_read_id, auth.uid())
);

-- Also fix buddy_messages policies (same pattern, though not yet recursing)
DROP POLICY IF EXISTS "Members read messages" ON public.buddy_messages;
CREATE POLICY "Members read messages"
ON public.buddy_messages
FOR SELECT
TO authenticated
USING (
  public.is_buddy_member(buddy_read_id, auth.uid())
  OR public.is_buddy_owner(buddy_read_id, auth.uid())
);

DROP POLICY IF EXISTS "Members post messages" ON public.buddy_messages;
CREATE POLICY "Members post messages"
ON public.buddy_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.is_buddy_member(buddy_read_id, auth.uid())
    OR public.is_buddy_owner(buddy_read_id, auth.uid())
  )
);