-- ============================================================================
-- Rollback Migration: Drop Razorpay Webhook Events Table
-- Rollback for: 20251029080000_create_razorpay_webhook_events_table.sql
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_webhook_events_updated_at ON public.webhook_events;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS get_webhook_statistics();
DROP FUNCTION IF EXISTS get_unprocessed_webhooks(INTEGER);
DROP FUNCTION IF EXISTS verify_webhook_signature(VARCHAR, BOOLEAN);
DROP FUNCTION IF EXISTS mark_webhook_failed(VARCHAR, TEXT);
DROP FUNCTION IF EXISTS mark_webhook_processed(VARCHAR, UUID, UUID);
DROP FUNCTION IF EXISTS record_webhook_event(VARCHAR, VARCHAR, VARCHAR, JSONB, VARCHAR);
DROP FUNCTION IF EXISTS is_webhook_event_processed(VARCHAR);
DROP FUNCTION IF EXISTS update_webhook_events_updated_at();

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users cannot access webhook events" ON public.webhook_events;
DROP POLICY IF EXISTS "Service role has full access to webhook events" ON public.webhook_events;

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_webhook_events_unverified;
DROP INDEX IF EXISTS idx_webhook_events_unprocessed;
DROP INDEX IF EXISTS idx_webhook_events_related_payment_id;
DROP INDEX IF EXISTS idx_webhook_events_related_subscription_id;
DROP INDEX IF EXISTS idx_webhook_events_created_at;
DROP INDEX IF EXISTS idx_webhook_events_processing_status;
DROP INDEX IF EXISTS idx_webhook_events_event_type;
DROP INDEX IF EXISTS idx_webhook_events_event_id;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS public.webhook_events CASCADE;
