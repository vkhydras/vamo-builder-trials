-- Migration 010: Add missing RLS policies

-- Offers: Owner can update own offers (needed to expire old offers)
CREATE POLICY "Owner can update own offers"
  ON offers FOR UPDATE
  USING (auth.uid() = user_id);

-- Offers: Admins can view all offers
CREATE POLICY "Admins can view all offers"
  ON offers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Messages: Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Activity Events: Admins can view all events (already exists but ensuring)
-- (This was already in 004 but adding a safety check)

-- Projects: Admins can update all projects
CREATE POLICY "Admins can update all projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Listings: Admins can view all listings
CREATE POLICY "Admins can view all listings"
  ON listings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Listings: Admins can update all listings
CREATE POLICY "Admins can update all listings"
  ON listings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
