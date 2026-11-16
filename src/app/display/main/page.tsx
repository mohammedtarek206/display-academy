"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AcademySettings } from "@/lib/types";
import TopBar from "@/components/display/TopBar";
import Ticker from "@/components/display/Ticker";
import MediaSlider from "@/components/display/MediaSlider";
import RoomList from "@/components/display/RoomList";
import { Users, Presentation, Award, UserCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MainDisplay() {
  const supabase = createClient();
  const [settings, setSettings] = useState<Partial<AcademySettings> | null>(null);
  const [stats, setStats] = useState({ students: 0, trainers: 0, rooms: 0, lectures: 0 });
  const [activeLectures, setActiveLectures] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<{id:string; type:"image"|"video"; url:string; title?:string}[]>([]);
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const { data: set } = await supabase.from("academy_settings").select("*").limit(1).single();
      if (set) setSettings(set);

      const [s, t, r, l] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("trainers").select("id", { count: "exact", head: true }),
        supabase.from("rooms").select("id", { count: "exact", head: true }),
        supabase.from("lectures").select("id", { count: "exact", head: true }).eq("is_active", true)
      ]);
      setStats({ students: s.count??0, trainers: t.count??0, rooms: r.count??0, lectures: l.count??0 });

      const { data: lectures } = await supabase.from("lectures")
        .select("*, room:rooms(*), trainer:trainers(name), course:courses(name)")
        .eq("is_active", true);
      
      const { data: allRooms } = await supabase.from("rooms").select("*").order("name");
      
      const roomsList = (allRooms || []).map(room => {
        const activeLec = lectures?.find(lec => lec.room_id === room.id);
        let remaining = "";
        if (activeLec) {
          const diff = Math.max(0, Math.floor((new Date(activeLec.end_time).getTime() - Date.now()) / 60000));
          remaining = diff > 60 ? `${Math.floor(diff/60)}س ${diff%60}د` : `${diff} دقيقة`;
        }
        return {
          id: room.id, name: room.name,
          status: activeLec ? "occupied" : room.status,
          trainer: activeLec?.trainer?.name,
          course: activeLec?.course?.name,
          studentsCount: activeLec?.students_count,
          remainingTime: remaining
        };
      });
      roomsList.sort((a,b) => (a.status === "occupied" ? -1 : 1) - (b.status === "occupied" ? -1 : 1));
      setActiveLectures(roomsList);

      const [imgRes, vidRes] = await Promise.all([
        supabase.from("gallery_images").select("*").eq("is_active", true).order("display_order"),
        supabase.from("videos").select("*").eq("is_active", true).order("display_order")
      ]);
      setMediaItems([
        ...(imgRes.data||[]).map(i => ({ id:i.id, type:"image" as const, url:i.url, title:i.title||undefined })),
        ...(vidRes.data||[]).map(v => ({ id:v.id, type:"video" as const, url:v.url, title:v.title||undefined }))
      ]);

      const now = new Date().toISOString();
      const { data: msg } = await supabase.from("welcome_messages")
        .select("text").eq("is_active", true)
        .in("display_on_screen", ["all","main"])
        .or(`scheduled_time.is.null,scheduled_time.lte.${now}`)
        .order("created_at", { ascending: false }).limit(1).single();
      setWelcomeMessage(msg?.text || "مرحباً بكم!");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 60000);
    const ch = supabase.channel("main-rt")
      .on("postgres_changes", { event:"*", schema:"public" }, loadData).subscribe();
    return () => { clearInterval(timer); supabase.removeChannel(ch); };
  }, [loadData, supabase]);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-blue-400" style={{ width:"5vw", height:"5vw" }} />
    </div>
  );

  return (
    <div
      className="display-root"
      dir="rtl"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "1.2vh 1.5vw",
        gap: "1vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        position: "relative",
      }}
    >
      {/* Background Grid */}
      <div style={{
        position:"absolute", inset:0, zIndex:0,
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
        backgroundSize: "40px 40px"
      }} />

      {/* Glow blobs */}
      <div style={{ position:"absolute", top:"10%", right:"20%", width:"30vw", height:"30vw", borderRadius:"50%", background:"rgba(37,99,235,0.08)", filter:"blur(80px)", zIndex:0 }} />
      <div style={{ position:"absolute", bottom:"20%", left:"10%", width:"20vw", height:"20vw", borderRadius:"50%", background:"rgba(124,58,237,0.08)", filter:"blur(60px)", zIndex:0 }} />

      <div style={{ position:"relative", zIndex:1, flex:1, display:"flex", flexDirection:"column", gap:"1vh", minHeight:0 }}>
        
        {/* TOP BAR */}
        <TopBar />

        {/* MAIN CONTENT */}
        <div style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "23fr 54fr 23fr",
          gap: "1.5vw",
          minHeight: 0,
          paddingBottom: "6vh", // space for ticker
        }}>

          {/* ===== RIGHT: Stats + Welcome ===== */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.2vh", minHeight:0 }}>
            
            {/* Stats Grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.8vw" }}>
              {[
                { label:"الطلاب",    value:stats.students,  icon:<Users />,         color:"#3b82f6", glow:"rgba(59,130,246,0.15)" },
                { label:"المدربون",  value:stats.trainers,  icon:<UserCheck />,     color:"#10b981", glow:"rgba(16,185,129,0.15)" },
                { label:"القاعات",   value:stats.rooms,     icon:<Presentation />,  color:"#8b5cf6", glow:"rgba(139,92,246,0.15)" },
                { label:"المحاضرات",value:stats.lectures,  icon:<Award />,         color:"#f59e0b", glow:"rgba(245,158,11,0.15)" },
              ].map(s => (
                <motion.div
                  key={s.label}
                  initial={{ opacity:0, scale:0.9 }}
                  animate={{ opacity:1, scale:1 }}
                  style={{
                    background: s.glow,
                    border: `1px solid ${s.color}30`,
                    borderRadius: "1.2vw",
                    padding: "1.5vh 0.8vw",
                    display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center",
                    gap:"0.6vh",
                    backdropFilter:"blur(12px)",
                    boxShadow:`0 0 20px ${s.glow}`,
                    minHeight:"10vh",
                  }}
                >
                  <div style={{
                    color: s.color,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    width:"3vw", height:"3vw",
                    background:"rgba(255,255,255,0.08)",
                    borderRadius:"0.8vw", padding:"0.5vw"
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize:"3.5vw", fontWeight:900, color:"#fff", lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:"1.1vw", fontWeight:600, color:`${s.color}cc` }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Welcome Message */}
            <div style={{
              flex:1, borderRadius:"1.2vw", padding:"1.5vh 1.2vw",
              background:"rgba(255,255,255,0.05)",
              backdropFilter:"blur(16px)",
              border:"1px solid rgba(255,255,255,0.1)",
              display:"flex", flexDirection:"column",
              overflow:"hidden", position:"relative",
              minHeight:0,
            }}>
              <div style={{ position:"absolute", top:0, right:0, width:"10vw", height:"10vw", background:"rgba(37,99,235,0.15)", borderRadius:"50%", filter:"blur(30px)" }} />
              <div style={{ fontSize:"1.3vw", fontWeight:700, color:"rgba(255,255,255,0.6)", marginBottom:"1vh" }}>💬 رسالة اليوم</div>
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={welcomeMessage}
                    initial={{ opacity:0, y:20 }}
                    animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, y:-20 }}
                    style={{
                      fontSize:"2vw", fontWeight:900, textAlign:"center", lineHeight:1.5,
                      background:"linear-gradient(135deg, #60a5fa, #a78bfa)",
                      WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                    }}
                  >
                    {welcomeMessage}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ===== CENTER: Media Slider ===== */}
          <div style={{
            borderRadius:"1.5vw", overflow:"hidden",
            border:"1px solid rgba(255,255,255,0.1)",
            boxShadow:"0 25px 60px rgba(0,0,0,0.5)",
            minHeight:0,
          }}>
            {settings?.display_show_images !== false || settings?.display_show_videos !== false ? (
              <MediaSlider items={mediaItems} interval={10000} />
            ) : (
              <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)" }}>
                <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"2vw", fontWeight:700 }}>الوسائط معطلة</span>
              </div>
            )}
          </div>

          {/* ===== LEFT: Rooms Status ===== */}
          <div style={{ minHeight:0, overflow:"hidden" }}>
            <RoomList rooms={activeLectures} />
          </div>

        </div>
      </div>

      {/* TICKER */}
      {settings?.display_show_announcements !== false && <Ticker />}
    </div>
  );
}
