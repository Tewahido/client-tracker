-- Defence in depth: signed-out visitors (the anon role) never write anything.
-- Every policy already targets `authenticated`, so anon writes match no rows; removing
-- the privileges means a future policy mistake still can't open writes to the public.

revoke insert, update, delete, truncate on
  public.organizations,
  public.organization_members,
  public.organization_invites,
  public.borrowers,
  public.loans,
  public.payments
from anon;
