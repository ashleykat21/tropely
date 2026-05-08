REVOKE EXECUTE ON FUNCTION public.is_buddy_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_buddy_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;