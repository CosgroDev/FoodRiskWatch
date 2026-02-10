-- Add subscription tier support and Stripe integration

-- Update frequency check constraint to include 'monthly'
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_frequency_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_frequency_check
  CHECK (frequency IN ('monthly', 'weekly', 'daily'));

-- Add Stripe fields
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_status text;

-- Create indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);

-- Update default frequency to monthly
ALTER TABLE subscriptions ALTER COLUMN frequency SET DEFAULT 'monthly';

-- Migrate existing users to monthly (free tier)
UPDATE subscriptions SET frequency = 'monthly' WHERE frequency = 'weekly' OR frequency = 'instant';

-- Add a field to track if welcome digest has been sent
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS welcome_digest_sent boolean DEFAULT false;
