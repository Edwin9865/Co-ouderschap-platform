/*
  # Row Level Security Policies
  
  ## Security Model
  
  ### Access Patterns
  1. **Parents (PARENT role)**
     - Full CRUD access to all data within their families
     - Can create, read, update, and soft-delete records
     
  2. **Helpers (HELPER role)**
     - Read-only access to families they're linked to
     - Can create questions
     - Cannot modify or delete any data
     
  3. **Admins (ADMIN global_role)**
     - Read-only access to all families
     - System oversight only
  
  ### Helper Functions
  - `is_family_member()` - Check if user is member of family
  - `is_family_parent()` - Check if user is parent in family
  - `is_family_helper()` - Check if user is helper in family
  
  ### Policy Structure
  - All policies check authentication first
  - Family-scoped access is enforced via family_members join
  - Parents and helpers have different permission levels
  - Soft deletes preserve data integrity
*/

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is member of family (any role)
CREATE OR REPLACE FUNCTION is_family_member(family_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = family_uuid
    AND user_id = auth.uid()
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is parent in family
CREATE OR REPLACE FUNCTION is_family_parent(family_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = family_uuid
    AND user_id = auth.uid()
    AND role = 'PARENT'
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is helper in family
CREATE OR REPLACE FUNCTION is_family_helper(family_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = family_uuid
    AND user_id = auth.uid()
    AND role = 'HELPER'
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's families
CREATE OR REPLACE FUNCTION get_user_families()
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
  SELECT family_id FROM family_members
  WHERE user_id = auth.uid()
  AND status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view family members"
  ON users FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT user_id FROM family_members
      WHERE family_id IN (SELECT get_user_families())
    )
  );

-- ============================================================================
-- FAMILIES POLICIES
-- ============================================================================

CREATE POLICY "Users can view their families"
  ON families FOR SELECT
  TO authenticated
  USING (id IN (SELECT get_user_families()));

CREATE POLICY "Parents can update their families"
  ON families FOR UPDATE
  TO authenticated
  USING (is_family_parent(id))
  WITH CHECK (is_family_parent(id));

CREATE POLICY "Authenticated users can create families"
  ON families FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- FAMILY MEMBERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view family members in their families"
  ON family_members FOR SELECT
  TO authenticated
  USING (family_id IN (SELECT get_user_families()));

CREATE POLICY "Parents can manage family members"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can update family members"
  ON family_members FOR UPDATE
  TO authenticated
  USING (is_family_parent(family_id))
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can remove family members"
  ON family_members FOR DELETE
  TO authenticated
  USING (is_family_parent(family_id));

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view subscriptions for their families"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (family_id IN (SELECT get_user_families()));

CREATE POLICY "Parents can manage subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can update subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (is_family_parent(family_id))
  WITH CHECK (is_family_parent(family_id));

-- ============================================================================
-- CHILDREN POLICIES
-- ============================================================================

CREATE POLICY "Users can view children in their families"
  ON children FOR SELECT
  TO authenticated
  USING (is_family_member(family_id));

CREATE POLICY "Parents can create children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can update children"
  ON children FOR UPDATE
  TO authenticated
  USING (is_family_parent(family_id))
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can delete children"
  ON children FOR DELETE
  TO authenticated
  USING (is_family_parent(family_id));

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view events in their families"
  ON events FOR SELECT
  TO authenticated
  USING (is_family_member(family_id));

CREATE POLICY "Parents can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (is_family_parent(family_id))
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (is_family_parent(family_id));

-- ============================================================================
-- LOG ENTRIES POLICIES
-- ============================================================================

CREATE POLICY "Users can view log entries in their families"
  ON log_entries FOR SELECT
  TO authenticated
  USING (is_family_member(family_id));

CREATE POLICY "Parents can create log entries"
  ON log_entries FOR INSERT
  TO authenticated
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can update log entries"
  ON log_entries FOR UPDATE
  TO authenticated
  USING (is_family_parent(family_id))
  WITH CHECK (is_family_parent(family_id));

-- Note: No DELETE policy - only soft deletes via UPDATE

-- ============================================================================
-- LOG ENTRY REVISIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view revisions for entries in their families"
  ON log_entry_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM log_entries
      WHERE log_entries.id = log_entry_revisions.log_entry_id
      AND is_family_member(log_entries.family_id)
    )
  );

CREATE POLICY "System can create revisions"
  ON log_entry_revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM log_entries
      WHERE log_entries.id = log_entry_revisions.log_entry_id
      AND is_family_parent(log_entries.family_id)
    )
  );

-- ============================================================================
-- REQUESTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view requests in their families"
  ON requests FOR SELECT
  TO authenticated
  USING (is_family_member(family_id));

CREATE POLICY "Parents can create requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can update requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (is_family_parent(family_id))
  WITH CHECK (is_family_parent(family_id));

-- ============================================================================
-- REQUEST MESSAGES POLICIES
-- ============================================================================

CREATE POLICY "Users can view messages in their family requests"
  ON request_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_messages.request_id
      AND is_family_member(requests.family_id)
    )
  );

CREATE POLICY "Parents can create messages"
  ON request_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_messages.request_id
      AND is_family_parent(requests.family_id)
    )
  );

CREATE POLICY "Parents can soft-delete their own messages"
  ON request_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- ============================================================================
-- QUESTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view questions in their families"
  ON questions FOR SELECT
  TO authenticated
  USING (is_family_member(family_id));

CREATE POLICY "Helpers can create questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (
    is_family_helper(family_id)
    AND helper_id = auth.uid()
  );

CREATE POLICY "Helpers can update their own questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (helper_id = auth.uid())
  WITH CHECK (helper_id = auth.uid());

-- ============================================================================
-- ANSWERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view answers to questions in their families"
  ON answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions
      WHERE questions.id = answers.question_id
      AND is_family_member(questions.family_id)
    )
  );

CREATE POLICY "Parents can create answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM questions
      WHERE questions.id = answers.question_id
      AND is_family_parent(questions.family_id)
    )
    AND parent_id = auth.uid()
  );

-- ============================================================================
-- ATTACHMENTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view attachments in their families"
  ON attachments FOR SELECT
  TO authenticated
  USING (is_family_member(family_id));

CREATE POLICY "Parents can upload attachments"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can delete attachments"
  ON attachments FOR DELETE
  TO authenticated
  USING (is_family_parent(family_id));

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

CREATE POLICY "Users can view audit logs for their families"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    family_id IS NULL
    OR is_family_member(family_id)
  );

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- SHARE LINKS POLICIES
-- ============================================================================

CREATE POLICY "Users can view share links for their families"
  ON share_links FOR SELECT
  TO authenticated
  USING (is_family_member(family_id));

CREATE POLICY "Parents can create share links"
  ON share_links FOR INSERT
  TO authenticated
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can update share links"
  ON share_links FOR UPDATE
  TO authenticated
  USING (is_family_parent(family_id))
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "Parents can delete share links"
  ON share_links FOR DELETE
  TO authenticated
  USING (is_family_parent(family_id));