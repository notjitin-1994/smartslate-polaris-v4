-- Create payment orders table for tracking Razorpay orders
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  tier TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Total amount in smallest currency unit (paise for INR)
  base_amount INTEGER NOT NULL, -- Base amount before GST
  gst_amount INTEGER NOT NULL, -- GST amount
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created',
  payment_method TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at DESC);

-- RLS policies
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment orders
CREATE POLICY "Users can view own payment orders" ON payment_orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all payment orders
CREATE POLICY "Service role can manage all payment orders" ON payment_orders
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create subscriptions table for tracking active subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_order_id UUID REFERENCES payment_orders(id),
  tier TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' 
        AND policyname = 'Users can view own subscriptions'
    ) THEN
        CREATE POLICY "Users can view own subscriptions" ON subscriptions
          FOR SELECT
          USING (auth.uid() = user_id);
    END IF;
END $$;;

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create webhook events table for tracking Razorpay webhooks
CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  entity TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON razorpay_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON razorpay_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON razorpay_webhook_events(created_at DESC);

-- Function to update subscription tier in user_profiles
CREATE OR REPLACE FUNCTION update_user_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles with the new subscription tier
  UPDATE user_profiles
  SET
    subscription_tier = NEW.tier,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user tier when subscription is created or updated
CREATE TRIGGER update_user_tier_on_subscription
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION update_user_subscription_tier();

-- Add comment
COMMENT ON TABLE payment_orders IS 'Stores all Razorpay payment orders for subscription tracking';
COMMENT ON TABLE subscriptions IS 'Stores active user subscriptions and their details';
COMMENT ON TABLE razorpay_webhook_events IS 'Logs all webhook events from Razorpay for processing';