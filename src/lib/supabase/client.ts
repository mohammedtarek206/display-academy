import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

export const createClient = () => {
  // نستخدم رابط وهمي صالح (Valid URL) لمنع الخطأ القاتل (Crash) 
  // في حال نسيان تغيير القيم في ملف .env.local
  const supabaseUrl = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : "https://placeholder.supabase.co";

  const supabaseKey = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : "placeholder-key";

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
};
