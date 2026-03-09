-- Add subscriber_user_id to subscriptions table
-- Tracks which user created/manages the Stripe subscription
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS subscriber_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
