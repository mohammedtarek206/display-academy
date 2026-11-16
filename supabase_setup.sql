-- ============================================================
-- Display Academy - Supabase Database Setup
-- شغّل هذا الكود في SQL Editor في Supabase
-- ============================================================

-- ─── Enable UUID extension ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TRAINERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  specialization  TEXT,
  phone           TEXT,
  email           TEXT,
  image_url       TEXT,
  bio             TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ROOMS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  capacity    INT  NOT NULL DEFAULT 20,
  status      TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance')),
  image_url   TEXT,
  qr_code_url TEXT,
  description TEXT,
  trainer_id  UUID REFERENCES trainers(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── COURSES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── STUDENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  code                TEXT NOT NULL UNIQUE,
  phone               TEXT,
  email               TEXT,
  image_url           TEXT,
  qr_code_url         TEXT,
  current_room_id     UUID REFERENCES rooms(id) ON DELETE SET NULL,
  current_trainer_id  UUID REFERENCES trainers(id) ON DELETE SET NULL,
  current_course_id   UUID REFERENCES courses(id) ON DELETE SET NULL,
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active','inactive','suspended')),
  registration_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── LECTURES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lectures (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  trainer_id      UUID REFERENCES trainers(id) ON DELETE SET NULL,
  course_id       UUID REFERENCES courses(id) ON DELETE SET NULL,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  students_count  INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ATTENDANCE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lecture_id  UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── GALLERY IMAGES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_images (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url              TEXT NOT NULL,
  title            TEXT,
  album            TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  display_order    INT NOT NULL DEFAULT 0,
  scheduled_start  TIMESTAMPTZ,
  scheduled_end    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── VIDEOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url            TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'mp4' CHECK (type IN ('mp4','youtube')),
  title          TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  display_order  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ANNOUNCEMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#ffffff',
  speed      TEXT NOT NULL DEFAULT 'normal' CHECK (speed IN ('slow','normal','fast')),
  is_active  BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date   DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── WELCOME MESSAGES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS welcome_messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text           TEXT NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  scheduled_time TIME,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ACTIVITIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT,
  type        TEXT,
  image_url   TEXT NOT NULL,
  event_date  DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ACADEMY SETTINGS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academy_settings (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                      TEXT NOT NULL DEFAULT 'أكاديمية أرقام',
  logo_url                  TEXT,
  primary_color             TEXT NOT NULL DEFAULT '#8b5cf6',
  secondary_color           TEXT NOT NULL DEFAULT '#06b6d4',
  phone                     TEXT,
  email                     TEXT,
  website                   TEXT,
  facebook                  TEXT,
  instagram                 TEXT,
  twitter                   TEXT,
  display_show_time         BOOLEAN NOT NULL DEFAULT true,
  display_show_weather      BOOLEAN NOT NULL DEFAULT true,
  display_show_announcements BOOLEAN NOT NULL DEFAULT true,
  display_show_videos       BOOLEAN NOT NULL DEFAULT true,
  display_show_images       BOOLEAN NOT NULL DEFAULT true,
  display_show_top_students BOOLEAN NOT NULL DEFAULT true,
  display_show_achievements BOOLEAN NOT NULL DEFAULT true,
  display_section_order     TEXT[] NOT NULL DEFAULT ARRAY['announcements','videos','images','students'],
  display_section_durations JSONB NOT NULL DEFAULT '{"announcements":10,"videos":30,"images":15,"students":20}',
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROFILES (للمستخدمين) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin','admin','staff','reception','trainer')),
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── إدخال إعدادات افتراضية ──────────────────────────────────
INSERT INTO academy_settings (name) VALUES ('أكاديمية أرقام')
ON CONFLICT DO NOTHING;

-- ─── RLS Policies (تفعيل القراءة والكتابة بدون مصادقة للتطوير) ──
ALTER TABLE rooms              ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;

-- السماح بكل العمليات للجميع (للتطوير فقط - يمكن تضييقه لاحقاً)
CREATE POLICY "allow_all_rooms"            ON rooms            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_trainers"         ON trainers         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_courses"          ON courses          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_students"         ON students         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lectures"         ON lectures         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_attendance"       ON attendance       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_gallery_images"   ON gallery_images   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_videos"           ON videos           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_announcements"    ON announcements    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_welcome_messages" ON welcome_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_activities"       ON activities       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_academy_settings" ON academy_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_profiles"         ON profiles         FOR ALL USING (true) WITH CHECK (true);

-- ─── Storage Bucket للصور ────────────────────────────────────
-- شغّل هذا بشكل منفصل من Storage > New Bucket في لوحة Supabase
-- أو من خلال SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-photos', 'room-photos', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('trainer-photos', 'trainer-photos', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('academy', 'academy', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "public_read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "public_upload" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete" ON storage.objects FOR DELETE USING (true);
