export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      jobcc_agent_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          function_name: string
          id: string
          job_id: string | null
          model_role: string
          record: Json
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          workflow_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          function_name?: string
          id: string
          job_id?: string | null
          model_role?: string
          record?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workflow_type?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          function_name?: string
          id?: string
          job_id?: string | null
          model_role?: string
          record?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_agent_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_agent_steps: {
        Row: {
          created_at: string
          id: string
          label: string
          record: Json
          run_id: string
          status: string
          step_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          label?: string
          record?: Json
          run_id: string
          status?: string
          step_index?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          record?: Json
          run_id?: string
          status?: string
          step_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_agent_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "jobcc_agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_ai_outputs: {
        Row: {
          approved: boolean
          career_canon_version: string
          created_at: string
          id: string
          job_id: string
          output_type: string
          outreach_playbook_version: string
          preference_model_version: string
          public_profile_version: string
          record: Json
          resume_playbook_version: string
          updated_at: string
          used: boolean
          user_id: string
        }
        Insert: {
          approved?: boolean
          career_canon_version?: string
          created_at?: string
          id: string
          job_id: string
          output_type?: string
          outreach_playbook_version?: string
          preference_model_version?: string
          public_profile_version?: string
          record?: Json
          resume_playbook_version?: string
          updated_at?: string
          used?: boolean
          user_id?: string
        }
        Update: {
          approved?: boolean
          career_canon_version?: string
          created_at?: string
          id?: string
          job_id?: string
          output_type?: string
          outreach_playbook_version?: string
          preference_model_version?: string
          public_profile_version?: string
          record?: Json
          resume_playbook_version?: string
          updated_at?: string
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_ai_outputs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_allowed_users: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      jobcc_application_history: {
        Row: {
          created_at: string
          event_date: string | null
          event_type: string
          id: string
          job_id: string
          record: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_type?: string
          id: string
          job_id: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_type?: string
          id?: string
          job_id?: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_application_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_application_records: {
        Row: {
          application_status: string
          company: string
          created_at: string
          id: string
          job_id: string | null
          needs_user_selection: boolean
          record: Json
          submitted_date: string
          submitted_resume_document_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_status?: string
          company?: string
          created_at?: string
          id: string
          job_id?: string | null
          needs_user_selection?: boolean
          record?: Json
          submitted_date?: string
          submitted_resume_document_id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          application_status?: string
          company?: string
          created_at?: string
          id?: string
          job_id?: string | null
          needs_user_selection?: boolean
          record?: Json
          submitted_date?: string
          submitted_resume_document_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_application_records_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_application_tracking: {
        Row: {
          application_status: string
          applied_date: string | null
          created_at: string
          follow_up_date: string | null
          id: string
          job_id: string
          next_action: string
          next_action_due_date: string | null
          record: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          application_status?: string
          applied_date?: string | null
          created_at?: string
          follow_up_date?: string | null
          id: string
          job_id: string
          next_action?: string
          next_action_due_date?: string | null
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          application_status?: string
          applied_date?: string | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          job_id?: string
          next_action?: string
          next_action_due_date?: string | null
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_application_tracking_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_approvals: {
        Row: {
          created_at: string
          id: string
          item_type: string
          job_id: string | null
          record: Json
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          item_type?: string
          job_id?: string | null
          record?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_type?: string
          job_id?: string | null
          record?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_approvals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_browser_tasks: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          record: Json
          status: string
          stop_point: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          job_id?: string | null
          record?: Json
          status?: string
          stop_point?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          record?: Json
          status?: string
          stop_point?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_browser_tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_career_canon: {
        Row: {
          career_canon_version: string
          created_at: string
          id: string
          preference_model_version: string
          profile_summary: string
          public_profile_version: string
          record: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          career_canon_version?: string
          created_at?: string
          id: string
          preference_model_version?: string
          profile_summary?: string
          public_profile_version?: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          career_canon_version?: string
          created_at?: string
          id?: string
          preference_model_version?: string
          profile_summary?: string
          public_profile_version?: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobcc_career_facts: {
        Row: {
          approved_variants: string[]
          canonical_claim: string
          category: string
          created_at: string
          evidence_notes: string
          id: string
          last_reviewed_at: string | null
          prohibited_variants: string[]
          record: Json
          sensitivity: string
          source_document_ids: string[]
          status: string
          updated_at: string
          usable_for: string[]
          user_id: string
        }
        Insert: {
          approved_variants?: string[]
          canonical_claim?: string
          category?: string
          created_at?: string
          evidence_notes?: string
          id: string
          last_reviewed_at?: string | null
          prohibited_variants?: string[]
          record?: Json
          sensitivity?: string
          source_document_ids?: string[]
          status?: string
          updated_at?: string
          usable_for?: string[]
          user_id?: string
        }
        Update: {
          approved_variants?: string[]
          canonical_claim?: string
          category?: string
          created_at?: string
          evidence_notes?: string
          id?: string
          last_reviewed_at?: string | null
          prohibited_variants?: string[]
          record?: Json
          sensitivity?: string
          source_document_ids?: string[]
          status?: string
          updated_at?: string
          usable_for?: string[]
          user_id?: string
        }
        Relationships: []
      }
      jobcc_company_context: {
        Row: {
          approximate_size: string
          business_model: string
          careers_url: string
          company_about: string
          company_name: string
          company_stage: string
          created_at: string
          headquarters: string
          id: string
          industry: string
          last_updated_at: string | null
          official_website: string
          public_or_private: string
          record: Json
          source_links: string[]
          updated_at: string
          user_id: string
          why_company_may_interest_matthew: string
        }
        Insert: {
          approximate_size?: string
          business_model?: string
          careers_url?: string
          company_about?: string
          company_name?: string
          company_stage?: string
          created_at?: string
          headquarters?: string
          id: string
          industry?: string
          last_updated_at?: string | null
          official_website?: string
          public_or_private?: string
          record?: Json
          source_links?: string[]
          updated_at?: string
          user_id?: string
          why_company_may_interest_matthew?: string
        }
        Update: {
          approximate_size?: string
          business_model?: string
          careers_url?: string
          company_about?: string
          company_name?: string
          company_stage?: string
          created_at?: string
          headquarters?: string
          id?: string
          industry?: string
          last_updated_at?: string | null
          official_website?: string
          public_or_private?: string
          record?: Json
          source_links?: string[]
          updated_at?: string
          user_id?: string
          why_company_may_interest_matthew?: string
        }
        Relationships: []
      }
      jobcc_company_sources: {
        Row: {
          ats_job_url_pattern: string
          ats_provider: string
          browser_required_yes_no: string
          capture_strategy: string
          company_about_source_url: string
          company_group: string
          company_name: string
          compensation_source_notes: string
          created_at: string
          id: string
          job_posting_capture_notes: string
          known_department_filters: string[]
          known_keyword_patterns: string[]
          known_keyword_search_patterns: string[]
          known_location_filters: string[]
          known_remote_filters: string[]
          last_verified_at: string | null
          linkedin_company_url: string
          linkedin_jobs_url: string
          navigation_notes: string
          official_careers_home_url: string
          official_job_search_url: string
          official_website: string
          priority_tier: string
          record: Json
          source_adapter_type: string
          source_confidence: string
          target_role_families: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          ats_job_url_pattern?: string
          ats_provider?: string
          browser_required_yes_no?: string
          capture_strategy?: string
          company_about_source_url?: string
          company_group?: string
          company_name?: string
          compensation_source_notes?: string
          created_at?: string
          id: string
          job_posting_capture_notes?: string
          known_department_filters?: string[]
          known_keyword_patterns?: string[]
          known_keyword_search_patterns?: string[]
          known_location_filters?: string[]
          known_remote_filters?: string[]
          last_verified_at?: string | null
          linkedin_company_url?: string
          linkedin_jobs_url?: string
          navigation_notes?: string
          official_careers_home_url?: string
          official_job_search_url?: string
          official_website?: string
          priority_tier?: string
          record?: Json
          source_adapter_type?: string
          source_confidence?: string
          target_role_families?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          ats_job_url_pattern?: string
          ats_provider?: string
          browser_required_yes_no?: string
          capture_strategy?: string
          company_about_source_url?: string
          company_group?: string
          company_name?: string
          compensation_source_notes?: string
          created_at?: string
          id?: string
          job_posting_capture_notes?: string
          known_department_filters?: string[]
          known_keyword_patterns?: string[]
          known_keyword_search_patterns?: string[]
          known_location_filters?: string[]
          known_remote_filters?: string[]
          last_verified_at?: string | null
          linkedin_company_url?: string
          linkedin_jobs_url?: string
          navigation_notes?: string
          official_careers_home_url?: string
          official_job_search_url?: string
          official_website?: string
          priority_tier?: string
          record?: Json
          source_adapter_type?: string
          source_confidence?: string
          target_role_families?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobcc_decision_notes: {
        Row: {
          created_at: string
          id: string
          job_id: string
          matthew_rating: number | null
          record: Json
          updated_at: string
          user_decision: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          job_id: string
          matthew_rating?: number | null
          record?: Json
          updated_at?: string
          user_decision?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          matthew_rating?: number | null
          record?: Json
          updated_at?: string
          user_decision?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_decision_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_document_before_after_examples: {
        Row: {
          accepted_changes: string[]
          company: string | null
          created_at: string
          document_type: string
          final_approved_version: string
          id: string
          job_id: string | null
          learned_rule_candidate_ids: string[]
          matthew_feedback: string
          model_name: string
          original_draft: string
          promoted_rule_ids: string[]
          prompt_version: string
          provider: string
          record: Json
          rejected_changes: string[]
          revised_draft: string
          role_family: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_changes?: string[]
          company?: string | null
          created_at?: string
          document_type?: string
          final_approved_version?: string
          id: string
          job_id?: string | null
          learned_rule_candidate_ids?: string[]
          matthew_feedback?: string
          model_name?: string
          original_draft?: string
          promoted_rule_ids?: string[]
          prompt_version?: string
          provider?: string
          record?: Json
          rejected_changes?: string[]
          revised_draft?: string
          role_family?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          accepted_changes?: string[]
          company?: string | null
          created_at?: string
          document_type?: string
          final_approved_version?: string
          id?: string
          job_id?: string | null
          learned_rule_candidate_ids?: string[]
          matthew_feedback?: string
          model_name?: string
          original_draft?: string
          promoted_rule_ids?: string[]
          prompt_version?: string
          provider?: string
          record?: Json
          rejected_changes?: string[]
          revised_draft?: string
          role_family?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_document_before_after_examples_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_document_feedback: {
        Row: {
          accepted: boolean
          applied: boolean
          apply_scope: string
          created_at: string
          document_id: string | null
          feedback_text: string
          feedback_type: string
          id: string
          job_id: string | null
          promoted_to_rule: boolean
          record: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted?: boolean
          applied?: boolean
          apply_scope?: string
          created_at?: string
          document_id?: string | null
          feedback_text?: string
          feedback_type?: string
          id: string
          job_id?: string | null
          promoted_to_rule?: boolean
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          accepted?: boolean
          applied?: boolean
          apply_scope?: string
          created_at?: string
          document_id?: string | null
          feedback_text?: string
          feedback_type?: string
          id?: string
          job_id?: string | null
          promoted_to_rule?: boolean
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_document_feedback_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "jobcc_document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobcc_document_feedback_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_document_learning_rules: {
        Row: {
          active: boolean
          applies_to_company: string | null
          applies_to_document_type: string | null
          applies_to_role_family: string | null
          approved_by_matthew: boolean
          created_at: string
          id: string
          record: Json
          rule_category: string
          rule_text: string
          scope: string
          source_feedback_id: string | null
          strength: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          applies_to_company?: string | null
          applies_to_document_type?: string | null
          applies_to_role_family?: string | null
          approved_by_matthew?: boolean
          created_at?: string
          id: string
          record?: Json
          rule_category?: string
          rule_text?: string
          scope?: string
          source_feedback_id?: string | null
          strength?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          active?: boolean
          applies_to_company?: string | null
          applies_to_document_type?: string | null
          applies_to_role_family?: string | null
          approved_by_matthew?: boolean
          created_at?: string
          id?: string
          record?: Json
          rule_category?: string
          rule_text?: string
          scope?: string
          source_feedback_id?: string | null
          strength?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_document_learning_rules_source_feedback_id_fkey"
            columns: ["source_feedback_id"]
            isOneToOne: false
            referencedRelation: "jobcc_document_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_document_playbooks: {
        Row: {
          company: string | null
          created_at: string
          document_type: string
          id: string
          name: string
          purpose: string
          record: Json
          role_family: string | null
          status: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          company?: string | null
          created_at?: string
          document_type?: string
          id: string
          name?: string
          purpose?: string
          record?: Json
          role_family?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Update: {
          company?: string | null
          created_at?: string
          document_type?: string
          id?: string
          name?: string
          purpose?: string
          record?: Json
          role_family?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      jobcc_document_rule_applications: {
        Row: {
          applied_at: string
          created_at: string
          document_id: string | null
          id: string
          job_id: string | null
          record: Json
          rule_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          document_id?: string | null
          id: string
          job_id?: string | null
          record?: Json
          rule_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          document_id?: string | null
          id?: string
          job_id?: string | null
          record?: Json
          rule_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_document_rule_applications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "jobcc_document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobcc_document_rule_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobcc_document_rule_applications_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "jobcc_document_learning_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_document_versions: {
        Row: {
          career_canon_version: string
          company: string | null
          content: string
          created_at: string
          document_type: string
          feedback_ids_used: string[]
          id: string
          job_id: string | null
          model_name: string
          outreach_playbook_version: string
          playbook_version: string
          preference_model_version: string
          prompt_version: string
          provider: string
          public_profile_version: string
          record: Json
          resume_playbook_version: string
          role_family: string | null
          rule_ids_used: string[]
          status: string
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          career_canon_version?: string
          company?: string | null
          content?: string
          created_at?: string
          document_type?: string
          feedback_ids_used?: string[]
          id: string
          job_id?: string | null
          model_name?: string
          outreach_playbook_version?: string
          playbook_version?: string
          preference_model_version?: string
          prompt_version?: string
          provider?: string
          public_profile_version?: string
          record?: Json
          resume_playbook_version?: string
          role_family?: string | null
          rule_ids_used?: string[]
          status?: string
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Update: {
          career_canon_version?: string
          company?: string | null
          content?: string
          created_at?: string
          document_type?: string
          feedback_ids_used?: string[]
          id?: string
          job_id?: string | null
          model_name?: string
          outreach_playbook_version?: string
          playbook_version?: string
          preference_model_version?: string
          prompt_version?: string
          provider?: string
          public_profile_version?: string
          record?: Json
          resume_playbook_version?: string
          role_family?: string | null
          rule_ids_used?: string[]
          status?: string
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_document_versions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_generated_packets: {
        Row: {
          career_canon_version: string
          created_at: string
          id: string
          job_id: string | null
          outreach_playbook_version: string
          packet_type: string
          preference_model_version: string
          public_profile_version: string
          record: Json
          resume_playbook_version: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          career_canon_version?: string
          created_at?: string
          id: string
          job_id?: string | null
          outreach_playbook_version?: string
          packet_type?: string
          preference_model_version?: string
          public_profile_version?: string
          record?: Json
          resume_playbook_version?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          career_canon_version?: string
          created_at?: string
          id?: string
          job_id?: string | null
          outreach_playbook_version?: string
          packet_type?: string
          preference_model_version?: string
          public_profile_version?: string
          record?: Json
          resume_playbook_version?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_generated_packets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_interview_history: {
        Row: {
          created_at: string
          event_date: string | null
          event_type: string
          id: string
          job_id: string
          record: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_type?: string
          id: string
          job_id: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_type?: string
          id?: string
          job_id?: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_interview_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_interview_tracking: {
        Row: {
          created_at: string
          id: string
          interview_date: string | null
          interview_stage: string
          job_id: string
          record: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          interview_date?: string | null
          interview_stage?: string
          job_id: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_date?: string | null
          interview_stage?: string
          job_id?: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_interview_tracking_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_job_descriptions: {
        Row: {
          analysis_cost: number
          analysis_reused: boolean
          analysis_status: string
          created_at: string
          description_text: string
          first_captured_at: string | null
          id: string
          job_id: string
          job_summary: string
          last_captured_at: string | null
          last_verified_at: string | null
          normalized_posting_hash: string
          packet_blocked_reason: string
          packet_eligibility: string
          parsing_model_version: string
          posting_changed_yes_no: boolean
          posting_hash: string
          preferred_qualifications: string[]
          prior_posting_hash: string
          record: Json
          required_qualifications: string[]
          rerun_reason: string
          responsibilities: string[]
          score_status: string
          scoring_model_version: string
          skills_keywords: string[]
          source_url: string
          team_summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_cost?: number
          analysis_reused?: boolean
          analysis_status?: string
          created_at?: string
          description_text?: string
          first_captured_at?: string | null
          id: string
          job_id: string
          job_summary?: string
          last_captured_at?: string | null
          last_verified_at?: string | null
          normalized_posting_hash?: string
          packet_blocked_reason?: string
          packet_eligibility?: string
          parsing_model_version?: string
          posting_changed_yes_no?: boolean
          posting_hash?: string
          preferred_qualifications?: string[]
          prior_posting_hash?: string
          record?: Json
          required_qualifications?: string[]
          rerun_reason?: string
          responsibilities?: string[]
          score_status?: string
          scoring_model_version?: string
          skills_keywords?: string[]
          source_url?: string
          team_summary?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          analysis_cost?: number
          analysis_reused?: boolean
          analysis_status?: string
          created_at?: string
          description_text?: string
          first_captured_at?: string | null
          id?: string
          job_id?: string
          job_summary?: string
          last_captured_at?: string | null
          last_verified_at?: string | null
          normalized_posting_hash?: string
          packet_blocked_reason?: string
          packet_eligibility?: string
          parsing_model_version?: string
          posting_changed_yes_no?: boolean
          posting_hash?: string
          preferred_qualifications?: string[]
          prior_posting_hash?: string
          record?: Json
          required_qualifications?: string[]
          rerun_reason?: string
          responsibilities?: string[]
          score_status?: string
          scoring_model_version?: string
          skills_keywords?: string[]
          source_url?: string
          team_summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_job_descriptions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_job_fact_matches: {
        Row: {
          created_at: string
          fact_id: string
          id: string
          job_id: string
          match_score: number
          record: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fact_id: string
          id: string
          job_id: string
          match_score?: number
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          fact_id?: string
          id?: string
          job_id?: string
          match_score?: number
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_job_fact_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_jobs: {
        Row: {
          analysis_cost: number
          analysis_reused: boolean
          analysis_status: string
          career_canon_version: string
          company: string
          created_at: string
          first_captured_at: string | null
          id: string
          last_captured_at: string | null
          last_verified_at: string | null
          location: string
          normalized_posting_hash: string
          opportunity_score: number | null
          packet_blocked_reason: string
          packet_eligibility: string
          parsing_model_version: string
          posting_changed_yes_no: boolean
          posting_hash: string
          preference_model_version: string
          prior_posting_hash: string
          record: Json
          rerun_reason: string
          role_title: string
          score_status: string
          scoring_model_version: string
          status: string
          updated_at: string
          user_decision: string
          user_id: string
        }
        Insert: {
          analysis_cost?: number
          analysis_reused?: boolean
          analysis_status?: string
          career_canon_version?: string
          company?: string
          created_at?: string
          first_captured_at?: string | null
          id: string
          last_captured_at?: string | null
          last_verified_at?: string | null
          location?: string
          normalized_posting_hash?: string
          opportunity_score?: number | null
          packet_blocked_reason?: string
          packet_eligibility?: string
          parsing_model_version?: string
          posting_changed_yes_no?: boolean
          posting_hash?: string
          preference_model_version?: string
          prior_posting_hash?: string
          record?: Json
          rerun_reason?: string
          role_title?: string
          score_status?: string
          scoring_model_version?: string
          status?: string
          updated_at?: string
          user_decision?: string
          user_id?: string
        }
        Update: {
          analysis_cost?: number
          analysis_reused?: boolean
          analysis_status?: string
          career_canon_version?: string
          company?: string
          created_at?: string
          first_captured_at?: string | null
          id?: string
          last_captured_at?: string | null
          last_verified_at?: string | null
          location?: string
          normalized_posting_hash?: string
          opportunity_score?: number | null
          packet_blocked_reason?: string
          packet_eligibility?: string
          parsing_model_version?: string
          posting_changed_yes_no?: boolean
          posting_hash?: string
          preference_model_version?: string
          prior_posting_hash?: string
          record?: Json
          rerun_reason?: string
          role_title?: string
          score_status?: string
          scoring_model_version?: string
          status?: string
          updated_at?: string
          user_decision?: string
          user_id?: string
        }
        Relationships: []
      }
      jobcc_model_collaboration_results: {
        Row: {
          approved_yes_no: boolean | null
          best_practice_learned: string
          created_at: string
          critic_provider: string
          document_type: string
          draft_provider: string
          finalizer_provider: string
          id: string
          job_id: string | null
          notes: string
          record: Json
          revision_count: number
          role_family: string | null
          updated_at: string
          user_id: string
          user_rating: number | null
        }
        Insert: {
          approved_yes_no?: boolean | null
          best_practice_learned?: string
          created_at?: string
          critic_provider?: string
          document_type?: string
          draft_provider?: string
          finalizer_provider?: string
          id: string
          job_id?: string | null
          notes?: string
          record?: Json
          revision_count?: number
          role_family?: string | null
          updated_at?: string
          user_id?: string
          user_rating?: number | null
        }
        Update: {
          approved_yes_no?: boolean | null
          best_practice_learned?: string
          created_at?: string
          critic_provider?: string
          document_type?: string
          draft_provider?: string
          finalizer_provider?: string
          id?: string
          job_id?: string | null
          notes?: string
          record?: Json
          revision_count?: number
          role_family?: string | null
          updated_at?: string
          user_id?: string
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_model_collaboration_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_model_critiques: {
        Row: {
          created_at: string
          critique_type: string
          id: string
          job_id: string | null
          record: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          critique_type?: string
          id: string
          job_id?: string | null
          record?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          critique_type?: string
          id?: string
          job_id?: string | null
          record?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_model_critiques_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_model_usage_logs: {
        Row: {
          cost_estimate: string
          created_at: string
          id: string
          model: string
          provider: string
          record: Json
          updated_at: string
          user_id: string
          workflow_type: string
        }
        Insert: {
          cost_estimate?: string
          created_at?: string
          id: string
          model?: string
          provider?: string
          record?: Json
          updated_at?: string
          user_id?: string
          workflow_type?: string
        }
        Update: {
          cost_estimate?: string
          created_at?: string
          id?: string
          model?: string
          provider?: string
          record?: Json
          updated_at?: string
          user_id?: string
          workflow_type?: string
        }
        Relationships: []
      }
      jobcc_resume_bank: {
        Row: {
          career_canon_version: string
          created_at: string
          id: string
          outreach_playbook_version: string
          preference_model_version: string
          public_profile_version: string
          record: Json
          resume_playbook_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          career_canon_version?: string
          created_at?: string
          id: string
          outreach_playbook_version?: string
          preference_model_version?: string
          public_profile_version?: string
          record?: Json
          resume_playbook_version?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          career_canon_version?: string
          created_at?: string
          id?: string
          outreach_playbook_version?: string
          preference_model_version?: string
          public_profile_version?: string
          record?: Json
          resume_playbook_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobcc_resume_lanes: {
        Row: {
          active_resume_version: string
          created_at: string
          id: string
          name: string
          record: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          active_resume_version?: string
          created_at?: string
          id: string
          name?: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          active_resume_version?: string
          created_at?: string
          id?: string
          name?: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobcc_role_families: {
        Row: {
          created_at: string
          id: string
          name: string
          recommended_lane_id: string
          record: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string
          recommended_lane_id?: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          recommended_lane_id?: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobcc_search_coverage: {
        Row: {
          aggregator_sources_checked: number
          companies_failed: string[]
          companies_not_searched: string[]
          companies_requested: string[]
          companies_searched: string[]
          coverage_notes: string
          coverage_percent: number
          created_at: string
          duplicates_removed: number
          id: string
          jobs_found: number
          jobs_needing_verification: number
          jobs_rejected: number
          jobs_verified: number
          linkedin_sources_checked: number
          official_sources_checked: number
          record: Json
          role_families_failed: string[]
          role_families_requested: string[]
          role_families_searched: string[]
          run_id: string
          search_complete: boolean
          search_queries_executed: number
          search_run_id: string
          sources_used: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          aggregator_sources_checked?: number
          companies_failed?: string[]
          companies_not_searched?: string[]
          companies_requested?: string[]
          companies_searched?: string[]
          coverage_notes?: string
          coverage_percent?: number
          created_at?: string
          duplicates_removed?: number
          id: string
          jobs_found?: number
          jobs_needing_verification?: number
          jobs_rejected?: number
          jobs_verified?: number
          linkedin_sources_checked?: number
          official_sources_checked?: number
          record?: Json
          role_families_failed?: string[]
          role_families_requested?: string[]
          role_families_searched?: string[]
          run_id: string
          search_complete?: boolean
          search_queries_executed?: number
          search_run_id: string
          sources_used?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          aggregator_sources_checked?: number
          companies_failed?: string[]
          companies_not_searched?: string[]
          companies_requested?: string[]
          companies_searched?: string[]
          coverage_notes?: string
          coverage_percent?: number
          created_at?: string
          duplicates_removed?: number
          id?: string
          jobs_found?: number
          jobs_needing_verification?: number
          jobs_rejected?: number
          jobs_verified?: number
          linkedin_sources_checked?: number
          official_sources_checked?: number
          record?: Json
          role_families_failed?: string[]
          role_families_requested?: string[]
          role_families_searched?: string[]
          run_id?: string
          search_complete?: boolean
          search_queries_executed?: number
          search_run_id?: string
          sources_used?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_search_coverage_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "jobcc_workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_search_runs: {
        Row: {
          career_canon_version: string
          completed_at: string | null
          created_at: string
          id: string
          preference_model_version: string
          record: Json
          search_complete: boolean
          search_run_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          career_canon_version?: string
          completed_at?: string | null
          created_at?: string
          id: string
          preference_model_version?: string
          record?: Json
          search_complete?: boolean
          search_run_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          career_canon_version?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          preference_model_version?: string
          record?: Json
          search_complete?: boolean
          search_run_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobcc_search_tasks: {
        Row: {
          attempts: number
          cancelled_at: string | null
          claimed_at: string | null
          company_cluster: string[]
          compensation_constraints: string
          completed_at: string | null
          created_at: string
          error: string | null
          failed_at: string | null
          id: string
          idempotency_key: string | null
          location_constraints: string
          lock_expires_at: string | null
          lock_owner: string | null
          max_attempts: number
          max_recovery_attempts: number
          official_career_urls: string[]
          query_text: string
          record: Json
          recovery_attempt_count: number
          recovery_status: string | null
          result_count: number
          role_family_cluster: string[]
          run_id: string
          search_run_id: string
          source_coverage: Json
          stale_detected_at: string | null
          stale_reason: string | null
          started_at: string | null
          status: string
          task_heartbeat_at: string | null
          task_timeout_at: string | null
          updated_at: string
          user_id: string
          worker_id: string | null
        }
        Insert: {
          attempts?: number
          cancelled_at?: string | null
          claimed_at?: string | null
          company_cluster?: string[]
          compensation_constraints?: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          failed_at?: string | null
          id: string
          idempotency_key?: string | null
          location_constraints?: string
          lock_expires_at?: string | null
          lock_owner?: string | null
          max_attempts?: number
          max_recovery_attempts?: number
          official_career_urls?: string[]
          query_text?: string
          record?: Json
          recovery_attempt_count?: number
          recovery_status?: string | null
          result_count?: number
          role_family_cluster?: string[]
          run_id: string
          search_run_id: string
          source_coverage?: Json
          stale_detected_at?: string | null
          stale_reason?: string | null
          started_at?: string | null
          status?: string
          task_heartbeat_at?: string | null
          task_timeout_at?: string | null
          updated_at?: string
          user_id?: string
          worker_id?: string | null
        }
        Update: {
          attempts?: number
          cancelled_at?: string | null
          claimed_at?: string | null
          company_cluster?: string[]
          compensation_constraints?: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          location_constraints?: string
          lock_expires_at?: string | null
          lock_owner?: string | null
          max_attempts?: number
          max_recovery_attempts?: number
          official_career_urls?: string[]
          query_text?: string
          record?: Json
          recovery_attempt_count?: number
          recovery_status?: string | null
          result_count?: number
          role_family_cluster?: string[]
          run_id?: string
          search_run_id?: string
          source_coverage?: Json
          stale_detected_at?: string | null
          stale_reason?: string | null
          started_at?: string | null
          status?: string
          task_heartbeat_at?: string | null
          task_timeout_at?: string | null
          updated_at?: string
          user_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_search_tasks_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "jobcc_workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_source_documents: {
        Row: {
          authority_level: string
          career_canon_version: string
          created_at: string
          id: string
          public_profile_version: string
          record: Json
          source_date: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          authority_level?: string
          career_canon_version?: string
          created_at?: string
          id: string
          public_profile_version?: string
          record?: Json
          source_date?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          authority_level?: string
          career_canon_version?: string
          created_at?: string
          id?: string
          public_profile_version?: string
          record?: Json
          source_date?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobcc_user_settings: {
        Row: {
          created_at: string
          id: string
          record: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          record?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobcc_workflow_artifacts: {
        Row: {
          artifact_type: string
          created_at: string
          id: string
          idempotency_key: string | null
          job_id: string | null
          raw_output: string | null
          record: Json
          run_id: string
          schema_name: string
          schema_version: string
          status: string
          step_id: string | null
          updated_at: string
          user_id: string
          validation_errors: string[]
        }
        Insert: {
          artifact_type?: string
          created_at?: string
          id: string
          idempotency_key?: string | null
          job_id?: string | null
          raw_output?: string | null
          record?: Json
          run_id: string
          schema_name?: string
          schema_version?: string
          status?: string
          step_id?: string | null
          updated_at?: string
          user_id?: string
          validation_errors?: string[]
        }
        Update: {
          artifact_type?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          job_id?: string | null
          raw_output?: string | null
          record?: Json
          run_id?: string
          schema_name?: string
          schema_version?: string
          status?: string
          step_id?: string | null
          updated_at?: string
          user_id?: string
          validation_errors?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_workflow_artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobcc_workflow_artifacts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "jobcc_workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_workflow_runs: {
        Row: {
          actual_cost: number | null
          cancellation_requested_at: string | null
          cancelled_at: string | null
          completed_at: string | null
          cost_estimate: number | null
          created_at: string
          current_step: string
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          input_record: Json
          job_id: string | null
          last_heartbeat_at: string | null
          max_actual_cost: number | null
          max_error_rate: number | null
          max_estimated_cost: number | null
          output_record: Json
          parent_run_id: string | null
          search_run_id: string | null
          started_at: string | null
          status: string
          total_steps: number
          trigger_type: string
          updated_at: string
          user_id: string
          worker_id: string | null
          workflow_type: string
        }
        Insert: {
          actual_cost?: number | null
          cancellation_requested_at?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string
          current_step?: string
          error_code?: string | null
          error_message?: string | null
          id: string
          idempotency_key?: string | null
          input_record?: Json
          job_id?: string | null
          last_heartbeat_at?: string | null
          max_actual_cost?: number | null
          max_error_rate?: number | null
          max_estimated_cost?: number | null
          output_record?: Json
          parent_run_id?: string | null
          search_run_id?: string | null
          started_at?: string | null
          status?: string
          total_steps?: number
          trigger_type?: string
          updated_at?: string
          user_id?: string
          worker_id?: string | null
          workflow_type?: string
        }
        Update: {
          actual_cost?: number | null
          cancellation_requested_at?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string
          current_step?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          input_record?: Json
          job_id?: string | null
          last_heartbeat_at?: string | null
          max_actual_cost?: number | null
          max_error_rate?: number | null
          max_estimated_cost?: number | null
          output_record?: Json
          parent_run_id?: string | null
          search_run_id?: string | null
          started_at?: string | null
          status?: string
          total_steps?: number
          trigger_type?: string
          updated_at?: string
          user_id?: string
          worker_id?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_workflow_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobcc_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcc_workflow_steps: {
        Row: {
          actual_cost: number | null
          actual_model: string | null
          attempt_count: number
          completed_at: string | null
          cost: number | null
          created_at: string
          error: Json | null
          estimated_cost: number | null
          function_name: string | null
          id: string
          idempotency_key: string | null
          input_artifact_ids: string[]
          latency_ms: number | null
          max_attempts: number
          model_role: string | null
          output_artifact_ids: string[]
          provider: string | null
          provider_request_id: string | null
          record: Json
          run_id: string
          search_query_count: number
          started_at: string | null
          status: string
          step_id: string
          step_order: number
          step_type: string
          token_usage: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_cost?: number | null
          actual_model?: string | null
          attempt_count?: number
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          error?: Json | null
          estimated_cost?: number | null
          function_name?: string | null
          id: string
          idempotency_key?: string | null
          input_artifact_ids?: string[]
          latency_ms?: number | null
          max_attempts?: number
          model_role?: string | null
          output_artifact_ids?: string[]
          provider?: string | null
          provider_request_id?: string | null
          record?: Json
          run_id: string
          search_query_count?: number
          started_at?: string | null
          status?: string
          step_id?: string
          step_order?: number
          step_type?: string
          token_usage?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          actual_cost?: number | null
          actual_model?: string | null
          attempt_count?: number
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          error?: Json | null
          estimated_cost?: number | null
          function_name?: string | null
          id?: string
          idempotency_key?: string | null
          input_artifact_ids?: string[]
          latency_ms?: number | null
          max_attempts?: number
          model_role?: string | null
          output_artifact_ids?: string[]
          provider?: string | null
          provider_request_id?: string | null
          record?: Json
          run_id?: string
          search_query_count?: number
          started_at?: string | null
          status?: string
          step_id?: string
          step_order?: number
          step_type?: string
          token_usage?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobcc_workflow_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "jobcc_workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      jobcc_claim_next_search_task: {
        Args: {
          p_claim_ttl_seconds?: number
          p_run_id: string
          p_worker_id: string
        }
        Returns: {
          attempts: number
          cancelled_at: string | null
          claimed_at: string | null
          company_cluster: string[]
          compensation_constraints: string
          completed_at: string | null
          created_at: string
          error: string | null
          failed_at: string | null
          id: string
          idempotency_key: string | null
          location_constraints: string
          lock_expires_at: string | null
          lock_owner: string | null
          max_attempts: number
          max_recovery_attempts: number
          official_career_urls: string[]
          query_text: string
          record: Json
          recovery_attempt_count: number
          recovery_status: string | null
          result_count: number
          role_family_cluster: string[]
          run_id: string
          search_run_id: string
          source_coverage: Json
          stale_detected_at: string | null
          stale_reason: string | null
          started_at: string | null
          status: string
          task_heartbeat_at: string | null
          task_timeout_at: string | null
          updated_at: string
          user_id: string
          worker_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "jobcc_search_tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      jobcc_is_allowed_user: { Args: never; Returns: boolean }
      jobcc_recover_stale_search_tasks: {
        Args: { p_claim_ttl_seconds?: number; p_run_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
