-- Make project_id nullable in activity_events to support events
-- that aren't project-specific (e.g., reward_redeemed)
ALTER TABLE activity_events ALTER COLUMN project_id DROP NOT NULL;
