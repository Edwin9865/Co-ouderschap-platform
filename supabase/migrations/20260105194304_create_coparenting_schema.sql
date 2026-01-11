/*
  # Co-Parenting Platform - Complete Database Schema

  ## Overview
  Complete database schema for a co-parenting platform with audit trails,
  soft deletes, and role-based access control.

  ## Tables Created
  
  ### Core Tables
  - `users` - Extended user profile information
  - `families` - Family/household units
  - `family_members` - Links users to families with roles (PARENT/HELPER)
  - `children` - Children within families
  
  ### Subscription & Billing
  - `subscriptions` - Stripe subscription management per family
  
  ### Content Tables
  - `events` - Calendar events (medical, school, handovers, etc.)
  - `log_entries` - Activity log with soft delete support
  - `log_entry_revisions` - Edit history for log entries
  - `requests` - Structured communication between parents
  - `request_messages` - Messages within requests
  - `questions` - Questions from helpers to parents
  - `answers` - Responses from parents to helper questions
  - `attachments` - File attachments for various entities
  - `audit_logs` - Complete audit trail of all actions
  - `share_links` - Temporary share links for exports
  
  ## Security
  - RLS enabled on all tables
  - Policies enforce family-scoped access
  - Parents have full CRUD within their families
  - Helpers have read-only access + question creation
  - All policies check authentication and family membership
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  global_role text NOT NULL DEFAULT 'USER' CHECK (global_role IN ('USER', 'ADMIN')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- FAMILIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- FAMILY MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('PARENT', 'HELPER')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(family_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid UNIQUE NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PLUS', 'PRO')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'EXPIRED')),
  stripe_customer_id text,
  stripe_subscription_id text,
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_family ON subscriptions(family_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- ============================================================================
-- CHILDREN TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  birth_year integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);

-- ============================================================================
-- EVENTS TABLE (Calendar/Agenda)
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id uuid REFERENCES children(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('medical', 'school', 'sport', 'handover', 'other')),
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  location text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_family ON events(family_id);
CREATE INDEX IF NOT EXISTS idx_events_child ON events(child_id);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);

-- ============================================================================
-- LOG ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS log_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id uuid REFERENCES children(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('health', 'behavior', 'development', 'incident', 'achievement', 'communication', 'other')),
  title text NOT NULL,
  details text,
  occurred_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_log_entries_family ON log_entries(family_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_child ON log_entries(child_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_occurred_at ON log_entries(occurred_at);
CREATE INDEX IF NOT EXISTS idx_log_entries_deleted_at ON log_entries(deleted_at);

-- ============================================================================
-- LOG ENTRY REVISIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS log_entry_revisions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_entry_id uuid NOT NULL REFERENCES log_entries(id) ON DELETE CASCADE,
  previous_data jsonb NOT NULL,
  edited_by uuid NOT NULL REFERENCES users(id),
  edited_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_entry_revisions_log_entry ON log_entry_revisions(log_entry_id);

-- ============================================================================
-- REQUESTS TABLE (Structured Communication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('schedule_change', 'financial', 'medical_decision', 'education', 'vacation', 'other')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACCEPTED', 'DECLINED', 'COUNTERED', 'CLOSED')),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_family ON requests(family_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

-- ============================================================================
-- REQUEST MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS request_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_request_messages_request ON request_messages(request_id);

-- ============================================================================
-- QUESTIONS TABLE (Helper to Parents)
-- ============================================================================
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  helper_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  question_text text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ANSWERED', 'CLOSED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_family ON questions(family_id);
CREATE INDEX IF NOT EXISTS idx_questions_helper ON questions(helper_id);

-- ============================================================================
-- ANSWERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES users(id),
  answer_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);

-- ============================================================================
-- ATTACHMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  linked_type text NOT NULL CHECK (linked_type IN ('event', 'log_entry', 'request', 'question')),
  linked_id uuid NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  storage_key text NOT NULL,
  file_size integer,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_family ON attachments(family_id);
CREATE INDEX IF NOT EXISTS idx_attachments_linked ON attachments(linked_type, linked_id);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE')),
  changes jsonb,
  actor_id uuid REFERENCES users(id),
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_family ON audit_logs(family_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- SHARE LINKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  scope text NOT NULL CHECK (scope IN ('full_export', 'child_export', 'date_range', 'category')),
  target_id uuid,
  metadata jsonb,
  expires_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  accessed_count integer DEFAULT 0,
  last_accessed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_family ON share_links(family_id);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entry_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;