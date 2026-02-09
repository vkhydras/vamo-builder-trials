-- Fix infinite recursion in admin RLS policies
-- The admin policies query `profiles` to check is_admin, which triggers the same
-- RLS policies, causing infinite recursion. Fix by using a SECURITY DEFINER function.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop and recreate the recursive policy on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- Fix all other admin policies that have the same recursion risk

-- projects
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
CREATE POLICY "Admins can update all projects"
  ON projects FOR UPDATE
  USING (public.is_admin());

-- messages
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING (public.is_admin());

-- reward_ledger
DROP POLICY IF EXISTS "Admins can view all ledger" ON reward_ledger;
CREATE POLICY "Admins can view all ledger"
  ON reward_ledger FOR SELECT
  USING (public.is_admin());

-- redemptions
DROP POLICY IF EXISTS "Admins can view all redemptions" ON redemptions;
CREATE POLICY "Admins can view all redemptions"
  ON redemptions FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update redemptions" ON redemptions;
CREATE POLICY "Admins can update redemptions"
  ON redemptions FOR UPDATE
  USING (public.is_admin());

-- listings
DROP POLICY IF EXISTS "Admins can view all listings" ON listings;
CREATE POLICY "Admins can view all listings"
  ON listings FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all listings" ON listings;
CREATE POLICY "Admins can update all listings"
  ON listings FOR UPDATE
  USING (public.is_admin());

-- offers
DROP POLICY IF EXISTS "Admins can view all offers" ON offers;
CREATE POLICY "Admins can view all offers"
  ON offers FOR SELECT
  USING (public.is_admin());

-- analytics_events
DROP POLICY IF EXISTS "Admins can view analytics" ON analytics_events;
CREATE POLICY "Admins can view analytics"
  ON analytics_events FOR SELECT
  USING (public.is_admin());
