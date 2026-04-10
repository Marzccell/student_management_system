-- =============================================
-- StudyFlow — Database Schema
-- =============================================
-- Run this SQL in your Supabase project's SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- =============================================

-- =============================================
-- ASSIGNMENTS TABLE
-- Stores user assignments with title, subject,
-- deadline, status, and priority.
-- =============================================
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'not started'
    CHECK (status IN ('not started', 'in progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- STUDY SESSIONS TABLE
-- Stores planned study sessions with subject,
-- topic, duration (in minutes), and date.
-- =============================================
CREATE TABLE study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  duration INTEGER NOT NULL,           -- duration in minutes
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Ensures users can only access their own data.
-- =============================================
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Assignments: users can CRUD their own rows
CREATE POLICY "Users can view own assignments"
  ON assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments"
  ON assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments"
  ON assignments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignments"
  ON assignments FOR DELETE
  USING (auth.uid() = user_id);

-- Study sessions: users can CRUD their own rows
CREATE POLICY "Users can view own study_sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study_sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study_sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study_sessions"
  ON study_sessions FOR DELETE
  USING (auth.uid() = user_id);
