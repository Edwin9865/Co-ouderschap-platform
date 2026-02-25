/*
  # Add Enhanced Stripe Fields to Subscriptions

  1. Changes to subscriptions table
    - Add `current_period_start` - Start date of current billing period
    - Add `current_period_end` - End date of current billing period
    - Add `cancel_at_period_end` - Boolean indicating if subscription will cancel at period end
    - Add `trial_start` - Start date of trial period
    - Add `trial_end` - End date of trial period
    - Update `status` enum to include 'TRIALING' and 'INCOMPLETE'
    - Add index on stripe_subscription_id for faster webhook lookups

  2. Purpose
    - Support full Stripe subscription lifecycle
    - Track trial periods
    - Handle subscription cancellations gracefully
    - Enable accurate billing period tracking
*/

-- Drop existing status constraint and recreate with new values
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'status'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
    ALTER TABLE subscriptions 
      ADD CONSTRAINT subscriptions_status_check 
      CHECK (status IN ('ACTIVE', 'TRIALING', 'CANCELLED', 'PAST_DUE', 'EXPIRED', 'INCOMPLETE'));
  END IF;
END $$;

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'current_period_start'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN current_period_start timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN current_period_end timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'cancel_at_period_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'trial_start'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN trial_start timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'trial_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN trial_end timestamptz;
  END IF;
END $$;

-- Create index on stripe_subscription_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription 
  ON subscriptions(stripe_subscription_id);

-- Add comment to table
COMMENT ON TABLE subscriptions IS 'Manages family subscriptions with full Stripe integration including trials and cancellations';
