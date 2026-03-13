-- Add allow_parent_reply column to helper_messages
-- This gives helpers control over whether parents can continue replying after the helper responds.
-- Default true so existing threads are unaffected.
ALTER TABLE helper_messages
  ADD COLUMN IF NOT EXISTS allow_parent_reply boolean NOT NULL DEFAULT true;
