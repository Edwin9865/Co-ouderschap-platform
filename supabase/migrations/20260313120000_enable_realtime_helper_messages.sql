-- Enable real-time for helper_messages table
-- Without this, postgres_changes subscriptions silently receive no events.
ALTER PUBLICATION supabase_realtime ADD TABLE helper_messages;
