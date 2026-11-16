-- ============================================================
-- Display Academy - Full Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff', 'reception', 'trainer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Profiles (extends auth.users) ────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'staff'::user_role,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Rooms (القاعات) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 20,
  status room_status DEFAULT 'available'::room_status,
  image_url TEXT,
  qr_code_url TEXT,
  description TEXT,
  trainer_id UUID,  -- FK added after trainers table
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trainers (المدربين) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  email TEXT UNIQUE,
  image_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK for rooms.trainer_id after trainers exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rooms_trainer_id_fkey'
  ) THEN
    ALTER TABLE rooms ADD CONSTRAINT rooms_trainer_id_fkey
      FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── Courses / Subjects (المواد) ──────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Course ↔ Trainer (Many-to-Many) ─────────────────────────
CREATE TABLE IF NOT EXISTS trainer_courses (
  trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
  course_id  UUID REFERENCES courses(id)  ON DELETE CASCADE,
  PRIMARY KEY (trainer_id, course_id)
);

-- ─── Course ↔ Room (Many-to-Many) ────────────────────────────
CREATE TABLE IF NOT EXISTS room_courses (
  room_id   UUID REFERENCES rooms(id)   ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, course_id)
);

-- ─── Students (الطلاب) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  image_url TEXT,
  qr_code_url TEXT,
  current_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  current_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  current_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  subscription_status subscription_status DEFAULT 'active'::subscription_status,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Lectures / Schedule (الجداول) ───────────────────────────
CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  students_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  repeat_weekly BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Attendance (الحضور) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  status attendance_status DEFAULT 'present'::attendance_status,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lecture_id)
);

-- ─── Gallery Images (الصور) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  title TEXT,
  album TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Videos (الفيديوهات) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('mp4', 'youtube')) DEFAULT 'mp4',
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Announcements / Ticker (الإعلانات) ─────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  color TEXT DEFAULT '#ffffff',
  speed TEXT DEFAULT 'normal' CHECK (speed IN ('slow', 'normal', 'fast')),
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Welcome Messages (رسائل الترحيب) ───────────────────────
CREATE TABLE IF NOT EXISTS welcome_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  scheduled_time TIMESTAMPTZ,
  display_on_screen TEXT DEFAULT 'all', -- 'all', 'main', 'rooms', 'activities'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Activities / Events (الأنشطة) ────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  type TEXT, -- trip, graduation, honor, workshop
  image_url TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Academy Settings (إعدادات الأكاديمية) ───────────────────
CREATE TABLE IF NOT EXISTS academy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'أكاديمية العرض',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#7c3aed',
  phone TEXT,
  email TEXT,
  website TEXT,
  facebook TEXT,
  instagram TEXT,
  twitter TEXT,
  -- Display screen controls
  display_show_time BOOLEAN DEFAULT true,
  display_show_weather BOOLEAN DEFAULT true,
  display_show_announcements BOOLEAN DEFAULT true,
  display_show_videos BOOLEAN DEFAULT true,
  display_show_images BOOLEAN DEFAULT true,
  display_show_top_students BOOLEAN DEFAULT true,
  display_show_achievements BOOLEAN DEFAULT true,
  display_section_order TEXT[] DEFAULT ARRAY['media', 'rooms', 'announcements', 'students'],
  display_section_durations JSONB DEFAULT '{"media": 10, "rooms": 15, "announcements": 8, "students": 12}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO academy_settings (name) VALUES ('أكاديمية العرض')
ON CONFLICT DO NOTHING;

-- ─── RLS: Enable Row Level Security ──────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_settings ENABLE ROW LEVEL SECURITY;

-- Public read access (for display screens - no auth needed)
CREATE POLICY "Public read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Public read trainers" ON trainers FOR SELECT USING (true);
CREATE POLICY "Public read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public read lectures" ON lectures FOR SELECT USING (true);
CREATE POLICY "Public read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Public read welcome_messages" ON welcome_messages FOR SELECT USING (true);
CREATE POLICY "Public read gallery_images" ON gallery_images FOR SELECT USING (true);
CREATE POLICY "Public read videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Public read activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Public read academy_settings" ON academy_settings FOR SELECT USING (true);
CREATE POLICY "Public read students" ON students FOR SELECT USING (true);

-- Authenticated users (admin panel) - full access
CREATE POLICY "Authenticated full access rooms" ON rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access trainers" ON trainers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access courses" ON courses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access students" ON students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access lectures" ON lectures FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access attendance" ON attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access gallery" ON gallery_images FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access videos" ON videos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access announcements" ON announcements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access welcome_messages" ON welcome_messages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access activities" ON activities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access settings" ON academy_settings FOR ALL USING (auth.role() = 'authenticated');

-- ─── Realtime Publications ─────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE trainers;
ALTER PUBLICATION supabase_realtime ADD TABLE lectures;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE welcome_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE gallery_images;
ALTER PUBLICATION supabase_realtime ADD TABLE videos;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE academy_settings;

-- ─── Storage Buckets ──────────────────────────────────────────
-- Run these in Supabase Dashboard → Storage → New Bucket
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public) VALUES ('academy-media', 'academy-media', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('trainer-photos', 'trainer-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('room-photos', 'room-photos', true) ON CONFLICT DO NOTHING;

-- Storage public access policies
CREATE POLICY "Public read academy-media" ON storage.objects FOR SELECT USING (bucket_id = 'academy-media');
CREATE POLICY "Auth upload academy-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'academy-media' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete academy-media" ON storage.objects FOR DELETE USING (bucket_id = 'academy-media' AND auth.role() = 'authenticated');

CREATE POLICY "Public read student-photos" ON storage.objects FOR SELECT USING (bucket_id = 'student-photos');
CREATE POLICY "Auth upload student-photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete student-photos" ON storage.objects FOR DELETE USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Public read trainer-photos" ON storage.objects FOR SELECT USING (bucket_id = 'trainer-photos');
CREATE POLICY "Auth upload trainer-photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trainer-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Public read room-photos" ON storage.objects FOR SELECT USING (bucket_id = 'room-photos');
CREATE POLICY "Auth upload room-photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-photos' AND auth.role() = 'authenticated');
