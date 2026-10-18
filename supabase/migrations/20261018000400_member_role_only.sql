-- Security fix: owners may change a member's role, nothing else.
-- The update policy covered every column, so an owner could rewrite user_id (enrolling
-- anyone whose id they knew, without an invite) or email (forging who a member is).

revoke update on public.organization_members from authenticated;
grant update (role) on public.organization_members to authenticated;
