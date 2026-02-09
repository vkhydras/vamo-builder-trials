DROP POLICY IF EXISTS "Admins can view all events" ON activity_events;
  CREATE POLICY "Admins can view all events"
    ON activity_events FOR SELECT        
    USING (public.is_admin());