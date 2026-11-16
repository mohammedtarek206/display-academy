"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, TrendingUp, Users, Presentation, Calendar } from "lucide-react";

export default function ReportsPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTrainers: 0,
    totalRooms: 0,
    totalLectures: 0,
  });

  useEffect(() => {
    const load = async () => {
      const [s, t, r, l] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("trainers").select("id", { count: "exact", head: true }),
        supabase.from("rooms").select("id", { count: "exact", head: true }),
        supabase.from("lectures").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        totalStudents: s.count || 0,
        totalTrainers: t.count || 0,
        totalRooms: r.count || 0,
        totalLectures: l.count || 0,
      });
    };
    load();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">التقارير والإحصائيات</h2>
          <p className="text-slate-500 mt-1">نظرة تحليلية شاملة لأداء الأكاديمية</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
          <Calendar className="w-5 h-5" /> هذا الشهر
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "إجمالي التسجيلات", value: stats.totalStudents, icon: Users, color: "blue", trend: "+12%" },
          { label: "المحاضرات المنفذة", value: stats.totalLectures, icon: Presentation, color: "emerald", trend: "+5%" },
          { label: "نسبة إشغال القاعات", value: "78%", icon: BarChart3, color: "purple", trend: "+2%" },
          { label: "معدل نمو الأكاديمية", value: "15%", icon: TrendingUp, color: "amber", trend: "+1%" },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-5 bg-${s.color}-500 group-hover:scale-150 transition-transform duration-700`} />
            <div className="flex justify-between items-start z-10">
              <div className={`p-3 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-500/10 text-${s.color}-500`}>
                <s.icon className="w-6 h-6" />
              </div>
              <span className="text-emerald-500 font-bold text-sm bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                {s.trend}
              </span>
            </div>
            <div className="z-10">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{s.value}</h3>
              <p className="text-slate-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placeholder for actual charts, using visual mockups */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-6">معدل الحضور والإشغال</h3>
          <div className="flex-1 flex items-end gap-2 pt-10">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all relative group" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  يوم {i+1}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-6">توزيع الطلاب حسب المواد</h3>
          <div className="flex-1 flex flex-col gap-4 justify-center">
            {[
              { name: "تطوير الويب", p: 45, color: "bg-blue-500" },
              { name: "اللغة الإنجليزية", p: 30, color: "bg-emerald-500" },
              { name: "تصميم الجرافيك", p: 15, color: "bg-purple-500" },
              { name: "أخرى", p: 10, color: "bg-amber-500" },
            ].map(c => (
              <div key={c.name} className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>{c.name}</span>
                  <span>{c.p}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.p}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
