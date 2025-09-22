/*
  # Remote Internship Manager Database Schema

  1. New Tables
    - `profiles` - Extended user profiles with role information
    - `internships` - Internship postings with all details
    - `applications` - Student applications to internships
    - `internship_memberships` - Active intern memberships
    - `tasks` - Task assignments and tracking
    - `reports` - Progress report submissions
    - `feedbacks` - Evaluation and feedback system
    - `notifications` - In-app notification system
    - `audit_logs` - System activity tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure file uploads and user data

  3. Features
    - Multi-role authentication system
    - Complete internship workflow
    - Task and progress tracking
    - Comprehensive evaluation system
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'employer', 'admin');
CREATE TYPE application_status AS ENUM ('pending', 'shortlisted', 'rejected', 'accepted');
CREATE TYPE internship_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE membership_status AS ENUM ('onboarded', 'active', 'completed', 'left');
CREATE TYPE notification_type AS ENUM ('application', 'task', 'feedback', 'deadline', 'system');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  bio text,
  avatar_url text,
  company_name text, -- for employers
  college_name text, -- for students
  skills text[], -- array of skills
  phone text,
  location text,
  website text,
  linkedin_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Internships table
CREATE TABLE IF NOT EXISTS internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  requirements text,
  skills_required text[] DEFAULT '{}',
  duration_weeks integer NOT NULL DEFAULT 12,
  stipend decimal(10,2),
  vacancies integer NOT NULL DEFAULT 1,
  location text DEFAULT 'Remote',
  start_date date NOT NULL,
  end_date date NOT NULL,
  application_deadline date NOT NULL,
  status internship_status DEFAULT 'draft',
  attachment_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resume_url text,
  cover_letter text,
  status application_status DEFAULT 'pending',
  applied_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  notes text,
  UNIQUE(internship_id, student_id)
);

-- Internship memberships (active interns)
CREATE TABLE IF NOT EXISTS internship_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status membership_status DEFAULT 'onboarded',
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  completion_percentage integer DEFAULT 0,
  UNIQUE(internship_id, student_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id),
  assigned_to uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  start_date date,
  due_date date,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  estimated_hours decimal(5,2),
  actual_hours decimal(5,2) DEFAULT 0,
  attachment_urls text[] DEFAULT '{}',
  parent_task_id uuid REFERENCES tasks(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Progress reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id),
  title text NOT NULL,
  content text NOT NULL,
  hours_spent decimal(5,2) DEFAULT 0,
  attachment_urls text[] DEFAULT '{}',
  submitted_at timestamptz DEFAULT now(),
  week_ending date
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES profiles(id),
  to_user_id uuid NOT NULL REFERENCES profiles(id),
  task_id uuid REFERENCES tasks(id),
  report_id uuid REFERENCES reports(id),
  comment text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  payload jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id),
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Internships policies
CREATE POLICY "Anyone can view published internships"
  ON internships FOR SELECT
  TO authenticated
  USING (status = 'published' OR employer_id = auth.uid());

CREATE POLICY "Employers can manage their internships"
  ON internships FOR ALL
  TO authenticated
  USING (employer_id = auth.uid());

-- Applications policies
CREATE POLICY "Students can view their applications"
  ON applications FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR 
         internship_id IN (SELECT id FROM internships WHERE employer_id = auth.uid()));

CREATE POLICY "Students can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Employers can update application status"
  ON applications FOR UPDATE
  TO authenticated
  USING (internship_id IN (SELECT id FROM internships WHERE employer_id = auth.uid()));

-- Memberships policies
CREATE POLICY "Members can view relevant memberships"
  ON internship_memberships FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR 
         internship_id IN (SELECT id FROM internships WHERE employer_id = auth.uid()));

CREATE POLICY "Employers can manage memberships"
  ON internship_memberships FOR ALL
  TO authenticated
  USING (internship_id IN (SELECT id FROM internships WHERE employer_id = auth.uid()));

-- Tasks policies
CREATE POLICY "Users can view relevant tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR
         internship_id IN (SELECT id FROM internships WHERE employer_id = auth.uid()));

CREATE POLICY "Employers and assignees can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

-- Reports policies
CREATE POLICY "Users can view relevant reports"
  ON reports FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR
         internship_id IN (SELECT id FROM internships WHERE employer_id = auth.uid()));

CREATE POLICY "Students can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Feedback policies
CREATE POLICY "Users can view relevant feedback"
  ON feedbacks FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create feedback"
  ON feedbacks FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_internships_employer_id ON internships(employer_id);
CREATE INDEX idx_internships_status ON internships(status);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_internship_id ON applications(internship_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_internship_id ON tasks(internship_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internships_updated_at BEFORE UPDATE ON internships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();