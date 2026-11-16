"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AcademySettings, Lecture, Room } from "@/lib/types";
import TopBar from "@/components/display/TopBar";
import Ticker from "@/components/display/Ticker";
import MediaSlider from "@/components/display/MediaSlider";
import RoomList from "@/components/display/RoomList";
import { Users, Presentation, Award, UserCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StatItem {
  students: number;
  trainers: number;
  rooms: number;
  lectures: number;
}

export default function MainDisplay() {
  const supabase = createClient();
  const [settings, setSettings] = useState<Partial<AcademySettings> | null>(null);
  const [stats, setStats] = useState<StatItem>({ students: 0, trainers: 0, rooms: 0, lectures: 0 });
  const [activeLectures, setActiveLectures] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<{id:string; type:"image"|"video"; url:string; title?:string}[]>([]);
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Settings
      const { data: set } = await supabase.from("academy_settings").select("*").limit(1).single();
      if (set) setSettings(set);

      // Stats
      const [s, t, r, l] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("trainers").select("id", { count: "exact", head: true }),
        supabase.from("rooms").select("id", { count: "exact", head: true }),
        supabase.from("lectures").select("id", { count: "exact", head: true }).eq("is_active", true)
      ]);
      setStats({ students: s.count??0, trainers: t.count??0, rooms: r.count??0, lectures: l.count??0 });

      // Active Lectures
      const { data: lectures } = await supabase.from("lectures")
        .select("*, room:rooms(*), trainer:trainers(name), course:courses(name)")
        .eq("is_active", true);
      
      // Also fetch all rooms to show available ones
      const { data: allRooms } = await supabase.from("rooms").select("*").order("name");
      
      // Combine to format required by RoomList
      const roomsList = (allRooms || []).map(room => {
        const activeLec = lectures?.find(lec => lec.room_id === room.id);
        
        let remaining = "";
        if (activeLec) {
          const end = new Date(activeLec.end_time).getTime();
          const now = new Date().getTime();
          const diff = Math.max(0, Math.floor((end - now) / 60000));
          remaining = diff > 60 ? `${Math.floor(diff/60)} ساعة و ${diff%60} دقيقة` : `${diff} دقيقة`;
        }

        return {
          id: room.id,
          name: room.name,
          status: activeLec ? "occupied" : room.status,
          trainer: activeLec?.trainer?.name,
          course: activeLec?.course?.name,
          studentsCount: activeLec?.students_count,
          remainingTime: remaining
        };
      });
      
      // Sort so occupied are first
      roomsList.sort((a,b) => (a.status === "occupied" ? -1 : 1) - (b.status === "occupied" ? -1 : 1));
      setActiveLectures(roomsList);

      // Media
      const [imgRes, vidRes] = await Promise.all([
        supabase.from("gallery_images").select("*").eq("is_active", true).order("display_order"),
        supabase.from("videos").select("*").eq("is_active", true).order("display_order")
      ]);
      
      const media = [
        ...(imgRes.data || []).map(img => ({ id: img.id, type: "image" as const, url: img.url, title: img.title || undefined })),
        ...(vidRes.data || []).map(vid => ({ id: vid.id, type: "video" as const, url: vid.url, title: vid.title || undefined }))
      ];
      setMediaItems(media);

      // Welcome Message (for main screen or all)
      const now = new Date().toISOString();
      const { data: msg } = await supabase.from("welcome_messages")
        .select("text")
        .eq("is_active", true)
        .in("display_on_screen", ["all", "main"])
        .or(`scheduled_time.is.null,scheduled_time.lte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      setWelcomeMessage(msg?.text || "مرحباً بكم في أكاديمية العرض!");
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      // Periodic soft refresh for remaining time
      loadData();
    }, 60000);

    const ch = supabase.channel("main-display-rt")
      .on("postgres_changes", { event: "*", schema: "public" }, loadData)
      .subscribe();
      
    return () => { clearInterval(timer); supabase.removeChannel(ch); };
  }, [loadData, supabase]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Handle Dynamic Sections
  const showStats = settings?.display_show_top_students !== false; // Reuse flag or we can just always show stats
  
  return (
    <div className="h-screen w-screen flex flex-col p-6 overflow-hidden bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564')] bg-cover bg-center" dir="rtl">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl z-0" />

      <div className="relative z-10 flex flex-col h-full">
        <TopBar />

        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0 pb-20">
          
          {/* Right Section: Stats & Welcome */}
          <div className="col-span-3 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="الطلاب" value={stats.students.toString()} icon={<Users />} color="blue" />
              <StatCard title="المدربون" value={stats.trainers.toString()} icon={<UserCheck />} color="emerald" />
              <StatCard title="القاعات" value={stats.rooms.toString()} icon={<Presentation />} color="purple" />
              <StatCard title="المحاضرات" value={stats.lectures.toString()} icon={<Award />} color="amber" />
            </div>

            <div className="glass-card p-6 flex-1 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
              <h2 className="text-2xl font-bold text-white mb-6 relative z-10">رسالة اليوم</h2>
              <div className="flex-1 flex items-center justify-center relative z-10">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={welcomeMessage}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl text-center font-black leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-200"
                  >
                    "{welcomeMessage}"
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Center Section: Media Slider */}
          <div className="col-span-6 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            {settings?.display_show_images !== false || settings?.display_show_videos !== false ? (
               <MediaSlider items={mediaItems} interval={10000} />
            ) : (
              <div className="w-full h-full flex items-center justify-center glass-card">
                <span className="text-white/50 text-xl font-bold">الوسائط معطلة</span>
              </div>
            )}
          </div>

          {/* Left Section: Rooms Status */}
          <div className="col-span-3 h-full">
            <RoomList rooms={activeLectures.slice(0, 5)} />
          </div>

        </div>

        {settings?.display_show_announcements !== false && (
          <Ticker />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20",
    purple: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20",
    amber: "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20",
  };

  return (
    <div className={`glass-card p-6 flex flex-col items-center justify-center gap-3 border bg-gradient-to-br ${colors[color as keyof typeof colors]}`}>
      <div className="p-3 bg-white/10 rounded-xl">
        {icon}
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="text-sm font-semibold opacity-80">{title}</div>
    </div>
  );
}
