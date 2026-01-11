/*
  # Add Helper Read Tracking for Message Replies

  1. Changes
    - Add `helper_has_read_replies` column to track which replies the helper has read
    - This is an array of message IDs (replies) that the helper has seen
    - Used to track unread parent responses and show badges/notifications
  
  2. Purpose
    - Allows helpers to track which parent replies they've already reviewed
    - Enables showing "unread responses" counts on dashboard and family selector
    - Helps helpers see at a glance which questions have new responses to review
*/

-- Add column to track which replies the helper has read
ALTER TABLE helper_messages 
ADD COLUMN IF NOT EXISTS helper_has_read_replies uuid[] DEFAULT ARRAY[]::uuid[];

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_helper_messages_helper_read_replies 
ON helper_messages USING GIN (helper_has_read_replies);