-- ============================================================
-- RentFLO — idempotent index migration
-- Run this once against your Railway PostgreSQL database.
-- All statements use IF NOT EXISTS so re-running is safe.
-- ============================================================

-- properties
CREATE INDEX IF NOT EXISTS properties_owner_id_idx  ON properties  (owner_id);
CREATE INDEX IF NOT EXISTS properties_tenant_id_idx ON properties  (tenant_id);

-- ledgers
CREATE INDEX IF NOT EXISTS ledgers_property_id_idx    ON ledgers (property_id);
CREATE INDEX IF NOT EXISTS ledgers_status_idx          ON ledgers (status);
CREATE INDEX IF NOT EXISTS ledgers_property_month_idx  ON ledgers (property_id, month_year);

-- payments
CREATE INDEX IF NOT EXISTS payments_ledger_id_idx ON payments (ledger_id);
CREATE INDEX IF NOT EXISTS payments_order_id_idx  ON payments (razorpay_order_id);
CREATE INDEX IF NOT EXISTS payments_status_idx    ON payments (status);

-- notifications  (covers both full-list and unread-count queries)
CREATE INDEX IF NOT EXISTS notifications_user_id_idx   ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications (user_id, read);

-- messages  (covers unread-count and conversation list queries)
CREATE INDEX IF NOT EXISTS messages_property_id_idx   ON messages (property_id);
CREATE INDEX IF NOT EXISTS messages_receiver_read_idx ON messages (receiver_id, read);

-- maintenance_tickets  (previously unindexed — causes slow scans on busy properties)
CREATE INDEX IF NOT EXISTS maintenance_tickets_property_id_idx ON maintenance_tickets (property_id);
CREATE INDEX IF NOT EXISTS maintenance_tickets_tenant_id_idx   ON maintenance_tickets (tenant_id);
CREATE INDEX IF NOT EXISTS maintenance_tickets_status_idx      ON maintenance_tickets (status);

-- push_subscriptions  (previously unindexed — scanned on every push send)
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);
