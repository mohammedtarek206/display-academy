"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Users, UserCheck, Presentation, BookOpen, MessageSquare, TrendingUp, Activity, Loader2 } from "lucide-react";

interface Stats { students: number; trainers: number; rooms: number; courses: number; announcements: number; }
interface ActiveLecture { id: string; room: { name: string } | null; trainer: { name: string } | null; course: { name: string } | null; students_count: number; end_time: string; }

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({ students:0, trainers:0, rooms:0, courses:0, announcements:0 });
  const [activeLectures, setActiveLectures] = useState<ActiveLecture[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, r, c, a, l] = await Promise.all([
        supabase.from("students").select("*", { count:"exact", head:true }),
        supabase.from("trainers").select("*", { count:"exact", head:true }),
        supabase.from("rooms").select("*", { count:"exact", head:true }),
        supabase.from("courses").select("*", { count:"exact", head:true }),
        supabase.from("announcements").select("*", { count:"exact", head:true }).eq("is_active", true),
        supabase.from("lectures").select("*, room:rooms(name), trainer:trainers(name), course:courses(name)").eq("is_active", true),
      ]);
      setStats({ students: s.count??0, trainers: t.count??0, rooms: r.count??0, courses: c.count??0, announcements: a.count??0 });
      setActiveLectures((l.data as ActiveLecture[]) ?? []);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    load();
    const ch = supabase.channel("dashboard-rt")
      .on("postgres_changes",{ event:"*", schema:"public", table:"students" }, load)
      .on("postgres_changes",{ event:"*", schema:"public", table:"lectures" }, load)
      .on("postgres_changes",{ event:"*", schema:"public", table:"rooms" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, supabase]);

  const STATS = [
    { title:"إجمالي الطلاب",   value: stats.students,     icon: Users,         color:"bg-blue-500",    shadow:"shadow-blue-500/20" },
    { title:"المدربون",        value: stats.trainers,     icon: UserCheck,     color:"bg-emerald-500", shadow:"shadow-emerald-500/20" },
    { title:"القاعات",         value: stats.rooms,        icon: Presentation,  color:"bg-purple-500",  shadow:"shadow-purple-500/20" },
    { title:"المواد",          value: stats.courses,      icon: BookOpen,      color:"bg-cyan-500",    shadow:"shadow-cyan-500/20" },
    { title:"إعلانات نشطة",   value: stats.announcements,icon: MessageSquare, color:"bg-amber-500",   shadow:"shadow-amber-500/20" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">نظرة عامة</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          تحديث مباشر: متصل
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {STATS.map((s, i) => (
            <motion.div key={s.title} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
              className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${s.color}`} />
              <div className="relative z-10">
                <div className={`p-3 rounded-xl text-white shadow-lg ${s.color} ${s.shadow} w-fit mb-3`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{s.value.toLocaleString("ar")}</div>
                <div className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">{s.title}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Lectures */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" /> المحاضرات الجارية الآن
          </h3>
          {activeLectures.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Presentation className="w-12 h-12 mx-auto opacity-30 mb-3" />
              <p>لا توجد محاضرات نشطة حالياً</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLectures.map((l, i) => (
                <motion.div key={l.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                      {l.room?.name?.[0] ?? "Q"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{l.course?.name ?? "—"}</div>
                      <div className="text-xs text-slate-500">{l.room?.name} • {l.trainer?.name} • {l.students_count} طالب</div>
                    </div>
                  </div>
                  <div className="text-xs bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg font-bold">
                    ينتهي {new Date(l.end_time).toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"})}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> روابط سريعة
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"إضافة طالب",  href:"/admin/students",       color:"bg-blue-500 hover:bg-blue-600" },
              { label:"إضافة مدرب",  href:"/admin/trainers",       color:"bg-emerald-500 hover:bg-emerald-600" },
              { label:"إضافة قاعة",  href:"/admin/rooms",          color:"bg-purple-500 hover:bg-purple-600" },
              { label:"إضافة إعلان", href:"/admin/announcements",  color:"bg-amber-500 hover:bg-amber-600" },
              { label:"رفع صور",     href:"/admin/media",          color:"bg-pink-500 hover:bg-pink-600" },
              { label:"إعدادات العرض",href:"/admin/display-control",color:"bg-cyan-500 hover:bg-cyan-600" },
            ].map(({label,href,color})=>(
              <a key={href} href={href} className={`${color} text-white font-semibold text-sm px-4 py-3 rounded-xl text-center transition-colors`}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
