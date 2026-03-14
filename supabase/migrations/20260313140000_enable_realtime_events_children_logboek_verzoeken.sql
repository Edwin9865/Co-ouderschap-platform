-- Enable real-time for the remaining core tables.
-- Without this, postgres_changes subscriptions on these tables receive no events.
ALTER PUBLICATION supabase_realtime
  ADD TABLE events, children, log_entries, requests, request_proposals;
