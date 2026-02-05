-- Add last_digest_at column to track when digests were sent
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS last_digest_at TIMESTAMPTZ;

-- Index for efficient querying of subscriptions due for digests
CREATE INDEX IF NOT EXISTS idx_subscriptions_digest_due
ON subscriptions(frequency, last_digest_at, is_active)
WHERE is_active = TRUE;

COMMENT ON COLUMN subscriptions.last_digest_at IS 'Timestamp of when the last digest email was sent to this subscription';
