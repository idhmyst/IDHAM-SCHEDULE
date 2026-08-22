-- =========================================================
-- SQL Schema untuk IDHAM SCHEDULE di Supabase
-- Host: db.zwqqypwvgutrincrhxas.supabase.co
-- =========================================================

-- 1. Tabel Agenda & Janji Meeting
CREATE TABLE IF NOT EXISTS public.meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location TEXT DEFAULT 'Sekolah',
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel Perubahan / Override Jadwal
CREATE TABLE IF NOT EXISTS public.schedule_overrides (
  id TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  day TEXT NOT NULL,
  period INTEGER NOT NULL,
  new_subject_code TEXT,
  new_subject_name TEXT,
  new_room TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabel Riwayat Chat Bot
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  message_text TEXT NOT NULL,
  action_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS) & Public Access Policies
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write on meetings"
  ON public.meetings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read/write on schedule_overrides"
  ON public.schedule_overrides FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read/write on chat_logs"
  ON public.chat_logs FOR ALL USING (true) WITH CHECK (true);
