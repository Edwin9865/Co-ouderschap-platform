export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          global_role: 'USER' | 'ADMIN'
          account_type: 'PARENT' | 'HELPER'
          helper_invite_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          global_role?: 'USER' | 'ADMIN'
          account_type?: 'PARENT' | 'HELPER'
          helper_invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          global_role?: 'USER' | 'ADMIN'
          account_type?: 'PARENT' | 'HELPER'
          helper_invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      families: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string
          role: 'PARENT' | 'HELPER'
          status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
          joined_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id: string
          role: 'PARENT' | 'HELPER'
          status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'
          joined_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          user_id?: string
          role?: 'PARENT' | 'HELPER'
          status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'
          joined_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          family_id: string
          plan: 'FREE' | 'PLUS' | 'PRO'
          status: 'ACTIVE' | 'TRIALING' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED' | 'INCOMPLETE'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscriber_user_id: string | null
          valid_until: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          trial_start: string | null
          trial_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          plan?: 'FREE' | 'PLUS' | 'PRO'
          status?: 'ACTIVE' | 'TRIALING' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED' | 'INCOMPLETE'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscriber_user_id?: string | null
          valid_until?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          trial_start?: string | null
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          plan?: 'FREE' | 'PLUS' | 'PRO'
          status?: 'ACTIVE' | 'TRIALING' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED' | 'INCOMPLETE'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscriber_user_id?: string | null
          valid_until?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          trial_start?: string | null
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      children: {
        Row: {
          id: string
          family_id: string
          first_name: string
          birth_year: number | null
          color: string
          created_by: string
          created_at: string
          updated_at: string
          clothing_size: string | null
          shoe_size: string | null
          insurance: string | null
          meds_allergy: string | null
          vaccinations: string | null
          social_security_num: string | null
          passport_num: string | null
          passport_location: string | null
          other_info: string | null
          accounts_notes: string | null
          avatar_style: string | null
          avatar_seed: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          family_id: string
          first_name: string
          birth_year?: number | null
          color?: string
          created_by: string
          created_at?: string
          updated_at?: string
          clothing_size?: string | null
          shoe_size?: string | null
          insurance?: string | null
          meds_allergy?: string | null
          vaccinations?: string | null
          social_security_num?: string | null
          passport_num?: string | null
          passport_location?: string | null
          other_info?: string | null
          accounts_notes?: string | null
          avatar_style?: string | null
          avatar_seed?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          family_id?: string
          first_name?: string
          birth_year?: number | null
          color?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          clothing_size?: string | null
          shoe_size?: string | null
          insurance?: string | null
          meds_allergy?: string | null
          vaccinations?: string | null
          social_security_num?: string | null
          passport_num?: string | null
          passport_location?: string | null
          other_info?: string | null
          accounts_notes?: string | null
          avatar_style?: string | null
          avatar_seed?: string | null
          avatar_url?: string | null
        }
      }
      events: {
        Row: {
          id: string
          family_id: string
          child_id: string | null
          type: 'medical' | 'school' | 'sport' | 'handover' | 'other'
          title: string
          description: string | null
          start_at: string
          end_at: string | null
          location: string | null
          status: 'scheduled' | 'completed' | 'cancelled'
          recurrence_rule: string | null
          recurrence_end_date: string | null
          parent_event_id: string | null
          created_by: string
          created_at: string
          updated_at: string
          reminder_enabled: boolean
          reminder_minutes: number | null
          reminder_sent_at: string | null
        }
        Insert: {
          id?: string
          family_id: string
          child_id?: string | null
          type: 'medical' | 'school' | 'sport' | 'handover' | 'other'
          title: string
          description?: string | null
          start_at: string
          end_at?: string | null
          location?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled'
          recurrence_rule?: string | null
          recurrence_end_date?: string | null
          parent_event_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          reminder_enabled?: boolean
          reminder_minutes?: number | null
          reminder_sent_at?: string | null
        }
        Update: {
          id?: string
          family_id?: string
          child_id?: string | null
          type?: 'medical' | 'school' | 'sport' | 'handover' | 'other'
          title?: string
          description?: string | null
          start_at?: string
          end_at?: string | null
          location?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled'
          recurrence_rule?: string | null
          recurrence_end_date?: string | null
          parent_event_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          reminder_enabled?: boolean
          reminder_minutes?: number | null
          reminder_sent_at?: string | null
        }
      }
      log_entries: {
        Row: {
          id: string
          family_id: string
          child_id: string | null
          category: 'health' | 'behavior' | 'development' | 'incident' | 'achievement' | 'communication' | 'other'
          title: string
          details: string | null
          occurred_at: string
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          family_id: string
          child_id?: string | null
          category: 'health' | 'behavior' | 'development' | 'incident' | 'achievement' | 'communication' | 'other'
          title: string
          details?: string | null
          occurred_at: string
          created_by: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          family_id?: string
          child_id?: string | null
          category?: 'health' | 'behavior' | 'development' | 'incident' | 'achievement' | 'communication' | 'other'
          title?: string
          details?: string | null
          occurred_at?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      log_entry_revisions: {
        Row: {
          id: string
          log_entry_id: string
          previous_data: Json
          edited_by: string
          edited_at: string
        }
        Insert: {
          id?: string
          log_entry_id: string
          previous_data: Json
          edited_by: string
          edited_at?: string
        }
        Update: {
          id?: string
          log_entry_id?: string
          previous_data?: Json
          edited_by?: string
          edited_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          family_id: string
          child_id: string | null
          type: 'schedule_change' | 'financial' | 'medical_decision' | 'education' | 'vacation' | 'other'
          title: string
          description: string | null
          counter_proposal: string | null
          decline_reason: string | null
          status: 'OPEN' | 'ACCEPTED' | 'DECLINED' | 'COUNTERED' | 'CLOSED'
          created_by: string
          last_action_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          child_id?: string | null
          type: 'schedule_change' | 'financial' | 'medical_decision' | 'education' | 'vacation' | 'other'
          title: string
          description?: string | null
          counter_proposal?: string | null
          decline_reason?: string | null
          status?: 'OPEN' | 'ACCEPTED' | 'DECLINED' | 'COUNTERED' | 'CLOSED'
          created_by: string
          last_action_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          child_id?: string | null
          type?: 'schedule_change' | 'financial' | 'medical_decision' | 'education' | 'vacation' | 'other'
          title?: string
          description?: string | null
          counter_proposal?: string | null
          decline_reason?: string | null
          status?: 'OPEN' | 'ACCEPTED' | 'DECLINED' | 'COUNTERED' | 'CLOSED'
          created_by?: string
          last_action_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      request_messages: {
        Row: {
          id: string
          request_id: string
          sender_id: string
          message: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          request_id: string
          sender_id: string
          message: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          sender_id?: string
          message?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      request_proposals: {
        Row: {
          id: string
          request_id: string
          proposed_by: string
          proposal_text: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          proposed_by: string
          proposal_text: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          proposed_by?: string
          proposal_text?: string
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          family_id: string
          helper_id: string
          title: string
          question_text: string
          status: 'OPEN' | 'ANSWERED' | 'CLOSED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          helper_id: string
          title: string
          question_text: string
          status?: 'OPEN' | 'ANSWERED' | 'CLOSED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          helper_id?: string
          title?: string
          question_text?: string
          status?: 'OPEN' | 'ANSWERED' | 'CLOSED'
          created_at?: string
          updated_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          question_id: string
          parent_id: string
          answer_text: string
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          parent_id: string
          answer_text: string
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          parent_id?: string
          answer_text?: string
          created_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          family_id: string
          linked_type: 'event' | 'log_entry' | 'request' | 'question'
          linked_id: string
          file_name: string
          mime_type: string
          storage_key: string
          file_size: number | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          linked_type: 'event' | 'log_entry' | 'request' | 'question'
          linked_id: string
          file_name: string
          mime_type: string
          storage_key: string
          file_size?: number | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          linked_type?: 'event' | 'log_entry' | 'request' | 'question'
          linked_id?: string
          file_name?: string
          mime_type?: string
          storage_key?: string
          file_size?: number | null
          uploaded_by?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          family_id: string | null
          entity_type: string
          entity_id: string
          action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE'
          changes: Json | null
          actor_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id?: string | null
          entity_type: string
          entity_id: string
          action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE'
          changes?: Json | null
          actor_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string | null
          entity_type?: string
          entity_id?: string
          action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE'
          changes?: Json | null
          actor_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      share_links: {
        Row: {
          id: string
          family_id: string
          token: string
          scope: 'full_export' | 'child_export' | 'date_range' | 'category'
          target_id: string | null
          metadata: Json | null
          expires_at: string
          created_by: string
          created_at: string
          accessed_count: number
          last_accessed_at: string | null
        }
        Insert: {
          id?: string
          family_id: string
          token: string
          scope: 'full_export' | 'child_export' | 'date_range' | 'category'
          target_id?: string | null
          metadata?: Json | null
          expires_at: string
          created_by: string
          created_at?: string
          accessed_count?: number
          last_accessed_at?: string | null
        }
        Update: {
          id?: string
          family_id?: string
          token?: string
          scope?: 'full_export' | 'child_export' | 'date_range' | 'category'
          target_id?: string | null
          metadata?: Json | null
          expires_at?: string
          created_by?: string
          created_at?: string
          accessed_count?: number
          last_accessed_at?: string | null
        }
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          requests_enabled: boolean
          events_enabled: boolean
          logs_enabled: boolean
          browser_notifications_enabled: boolean
          push_notifications_enabled: boolean
          fcm_token: string | null
          created_at: string
          updated_at: string
          subscription_notifications_enabled: boolean
          helper_notifications_enabled: boolean
        }
        Insert: {
          id?: string
          user_id: string
          requests_enabled?: boolean
          events_enabled?: boolean
          logs_enabled?: boolean
          browser_notifications_enabled?: boolean
          push_notifications_enabled?: boolean
          fcm_token?: string | null
          created_at?: string
          updated_at?: string
          subscription_notifications_enabled?: boolean
          helper_notifications_enabled?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          requests_enabled?: boolean
          events_enabled?: boolean
          logs_enabled?: boolean
          browser_notifications_enabled?: boolean
          push_notifications_enabled?: boolean
          fcm_token?: string | null
          created_at?: string
          updated_at?: string
          subscription_notifications_enabled?: boolean
          helper_notifications_enabled?: boolean
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row'];
export type Family = Database['public']['Tables']['families']['Row'];
export type FamilyMember = Database['public']['Tables']['family_members']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Child = Database['public']['Tables']['children']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type LogEntry = Database['public']['Tables']['log_entries']['Row'];
export type LogEntryRevision = Database['public']['Tables']['log_entry_revisions']['Row'];
export type Request = Database['public']['Tables']['requests']['Row'];
export type RequestMessage = Database['public']['Tables']['request_messages']['Row'];
export type RequestProposal = Database['public']['Tables']['request_proposals']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type Answer = Database['public']['Tables']['answers']['Row'];
export type Attachment = Database['public']['Tables']['attachments']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type ShareLink = Database['public']['Tables']['share_links']['Row'];
export type NotificationSettings = Database['public']['Tables']['notification_settings']['Row'];
