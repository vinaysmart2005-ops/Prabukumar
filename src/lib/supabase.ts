import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: 'student' | 'employer' | 'admin';
          bio: string | null;
          avatar_url: string | null;
          company_name: string | null;
          college_name: string | null;
          skills: string[] | null;
          phone: string | null;
          location: string | null;
          website: string | null;
          linkedin_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      internships: {
        Row: {
          id: string;
          employer_id: string;
          title: string;
          slug: string;
          description: string;
          requirements: string | null;
          skills_required: string[];
          duration_weeks: number;
          stipend: number | null;
          vacancies: number;
          location: string;
          start_date: string;
          end_date: string;
          application_deadline: string;
          status: 'draft' | 'published' | 'closed';
          attachment_urls: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['internships']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['internships']['Insert']>;
      };
      applications: {
        Row: {
          id: string;
          internship_id: string;
          student_id: string;
          resume_url: string | null;
          cover_letter: string | null;
          status: 'pending' | 'shortlisted' | 'rejected' | 'accepted';
          applied_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'applied_at'>;
        Update: Partial<Database['public']['Tables']['applications']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          internship_id: string;
          created_by: string;
          assigned_to: string;
          title: string;
          description: string | null;
          start_date: string | null;
          due_date: string | null;
          status: 'todo' | 'in_progress' | 'review' | 'done';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          progress_percentage: number;
          estimated_hours: number | null;
          actual_hours: number;
          attachment_urls: string[];
          parent_task_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
    };
  };
};