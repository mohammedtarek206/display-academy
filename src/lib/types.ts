// Full TypeScript types matching the Supabase schema

export type UserRole = "super_admin" | "admin" | "staff" | "reception" | "trainer";
export type RoomStatus = "available" | "occupied" | "maintenance";
export type SubscriptionStatus = "active" | "inactive" | "suspended";
export type AnnouncementSpeed = "slow" | "normal" | "fast";

// ─── DB Row Types ──────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  name: string;
  capacity: number;
  status: RoomStatus;
  image_url: string | null;
  qr_code_url: string | null;
  description: string | null;
  trainer_id: string | null;
  created_at: string;
}

export interface Trainer {
  id: string;
  name: string;
  specialization: string | null;
  phone: string | null;
  email: string | null;
  image_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  image_url: string | null;
  qr_code_url: string | null;
  current_room_id: string | null;
  current_trainer_id: string | null;
  current_course_id: string | null;
  subscription_status: SubscriptionStatus;
  registration_date: string;
  created_at: string;
  // Joined fields (from queries)
  room?: Room | null;
  trainer?: Trainer | null;
  course?: Course | null;
}

export interface Lecture {
  id: string;
  room_id: string;
  trainer_id: string | null;
  course_id: string | null;
  start_time: string;
  end_time: string;
  students_count: number;
  is_active: boolean;
  created_at: string;
  // Joined
  room?: Room | null;
  trainer?: Trainer | null;
  course?: Course | null;
}

export interface Attendance {
  id: string;
  student_id: string;
  lecture_id: string;
  status: "present" | "absent" | "late";
  notes: string | null;
  created_at: string;
  student?: Student | null;
  lecture?: Lecture | null;
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string | null;
  album: string | null;
  is_active: boolean;
  display_order: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  url: string;
  type: "mp4" | "youtube";
  title: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  text: string;
  color: string;
  speed: AnnouncementSpeed;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface WelcomeMessage {
  id: string;
  text: string;
  is_active: boolean;
  scheduled_time: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  title: string | null;
  type: string | null;
  image_url: string;
  event_date: string | null;
  created_at: string;
}

export interface AcademySettings {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  display_show_time: boolean;
  display_show_weather: boolean;
  display_show_announcements: boolean;
  display_show_videos: boolean;
  display_show_images: boolean;
  display_show_top_students: boolean;
  display_show_achievements: boolean;
  display_section_order: string[];
  display_section_durations: Record<string, number>;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Database type for typed Supabase client ───────────────────────────────────

export type Database = {
  public: {
    Tables: {
      rooms: { Row: Room; Insert: Omit<Room, "id" | "created_at">; Update: Partial<Omit<Room, "id" | "created_at">>; };
      trainers: { Row: Trainer; Insert: Omit<Trainer, "id" | "created_at">; Update: Partial<Omit<Trainer, "id" | "created_at">>; };
      courses: { Row: Course; Insert: Omit<Course, "id" | "created_at">; Update: Partial<Omit<Course, "id" | "created_at">>; };
      students: { Row: Student; Insert: Omit<Student, "id" | "created_at" | "registration_date">; Update: Partial<Omit<Student, "id" | "created_at">>; };
      lectures: { Row: Lecture; Insert: Omit<Lecture, "id" | "created_at">; Update: Partial<Omit<Lecture, "id" | "created_at">>; };
      attendance: { Row: Attendance; Insert: Omit<Attendance, "id" | "created_at">; Update: Partial<Omit<Attendance, "id" | "created_at">>; };
      gallery_images: { Row: GalleryImage; Insert: Omit<GalleryImage, "id" | "created_at">; Update: Partial<Omit<GalleryImage, "id" | "created_at">>; };
      videos: { Row: Video; Insert: Omit<Video, "id" | "created_at">; Update: Partial<Omit<Video, "id" | "created_at">>; };
      announcements: { Row: Announcement; Insert: Omit<Announcement, "id" | "created_at">; Update: Partial<Omit<Announcement, "id" | "created_at">>; };
      welcome_messages: { Row: WelcomeMessage; Insert: Omit<WelcomeMessage, "id" | "created_at">; Update: Partial<Omit<WelcomeMessage, "id" | "created_at">>; };
      activities: { Row: Activity; Insert: Omit<Activity, "id" | "created_at">; Update: Partial<Omit<Activity, "id" | "created_at">>; };
      academy_settings: { Row: AcademySettings; Insert: Omit<AcademySettings, "id" | "updated_at">; Update: Partial<Omit<AcademySettings, "id">>; };
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at">; Update: Partial<Omit<Profile, "id" | "created_at">>; };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
