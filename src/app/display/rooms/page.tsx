"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, CalendarDays, Loader2 } from "lucide-react";
import TopBar from "@/components/display/TopBar";
import Ticker from "@/components/display/Ticker";

export default function RoomsDisplay() {
  const supabase = createClient();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    // Active Lectures
    const { data: lectures } = await supabase.from("lectures")
      .select("*, room:rooms(*), trainer:trainers(name), course:courses(name)")
      .eq("is_active", true);
    
    // All rooms
    const { data: allRooms } = await supabase.from("rooms").select("*").order("name");
    
    // Combine
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
        capacity: room.capacity,
        image: room.image_url || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070",
        status: activeLec ? "occupied" : room.status,
        trainer: activeLec?.trainer?.name,
        course: activeLec?.course?.name,
        studentsCount: activeLec?.students_count,
        remainingTime: remaining,
        startTime: activeLec ? new Date(activeLec.start_time).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "",
        endTime: activeLec ? new Date(activeLec.end_time).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "",
        nextBooking: "لا يوجد حجز قادم" // This could be fetched from future lectures
      };
    });
    
    setRooms(roomsList);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => loadData(), 60000); // Soft refresh for time
    const ch = supabase.channel("rooms-display-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "lectures" }, loadData)
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

  return (
    <div className="min-h-screen flex flex-col p-6 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029')] bg-cover bg-center" dir="rtl">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl z-0" />
      
      <div className="relative z-10 flex flex-col h-full flex-1">
        <TopBar />
        
        <div className="flex-1 pb-20">
          <div className="flex items-center gap-4 mb-8 px-4">
            <div className="p-3 bg-primary rounded-xl text-white shadow-lg shadow-primary/40">
              <CalendarDays className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-black text-white drop-shadow-lg">حالة القاعات والمحاضرات</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-4">
            <AnimatePresence>
              {rooms.map((room, i) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-card overflow-hidden flex flex-col border-2 ${
                    room.status === "available" ? "border-emerald-500/30" : room.status === "occupied" ? "border-rose-500/30" : "border-amber-500/30"
                  }`}
                >
                  {/* Room Image */}
                  <div className="h-48 relative">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${room.image})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    <div className="absolute top-4 right-4">
                      <span className={`px-6 py-2 rounded-full text-lg font-black shadow-lg backdrop-blur-md border ${
                        room.status === "available" ? "bg-emerald-500/80 text-white border-emerald-400" :
                        room.status === "occupied" ? "bg-rose-500/80 text-white border-rose-400" :
                        "bg-amber-500/80 text-white border-amber-400"
                      }`}>
                        {room.status === "available" ? "متاحة حالياً" : room.status === "occupied" ? "مشغولة الآن" : "صيانة"}
                      </span>
                    </div>

                    <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end">
                      <h3 className="text-3xl font-black text-white drop-shadow-md">{room.name}</h3>
                      <div className="flex items-center gap-2 text-white/90 bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm">
                        <Users className="w-5 h-5" />
                        <span className="font-bold">السعة: {room.capacity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="p-6 flex-1 flex flex-col bg-slate-900/50">
                    {room.status === "occupied" ? (
                      <div className="space-y-4 flex-1">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                          <div className="text-sm text-slate-400 mb-1">المادة الحالية</div>
                          <div className="text-2xl font-bold text-white">{room.course}</div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-slate-400 mb-1">المدرب</div>
                            <div className="text-lg font-bold text-primary-300">{room.trainer}</div>
                          </div>
                          <div className="text-left">
                            <div className="text-sm text-slate-400 mb-1">الحضور</div>
                            <div className="text-lg font-bold text-emerald-400">{room.studentsCount || 0} طالب</div>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                          <div className="flex items-center gap-2 text-rose-300 font-bold bg-rose-500/10 px-4 py-2 rounded-lg">
                            <Clock className="w-5 h-5" />
                            باقي {room.remainingTime}
                          </div>
                          <div className="text-sm font-medium text-slate-400" dir="ltr">
                            {room.startTime} - {room.endTime}
                          </div>
                        </div>
                      </div>
                    ) : room.status === "available" ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                          <CalendarDays className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-white mb-2">القاعة جاهزة للاستخدام</h4>
                          <p className="text-emerald-300 font-medium">متاحة للحجز والتدريب</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400">
                          <Clock className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-white mb-2">القاعة قيد الصيانة</h4>
                          <p className="text-amber-300 font-medium">غير متاحة للاستخدام حالياً</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        <Ticker />
      </div>
    </div>
  );
}
