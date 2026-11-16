"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AcademySettings } from "@/lib/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Sun } from "lucide-react";
import Image from "next/image";

export default function TopBar() {
  const supabase = createClient();
  const [time, setTime] = useState(new Date());
  const [settings, setSettings] = useState<Partial<AcademySettings> | null>(null);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from("academy_settings")
      .select("name,logo_url,display_show_time,display_show_weather").limit(1).single();
    setSettings(data);
  }, [supabase]);

  useEffect(() => {
    loadSettings();
    const timer = setInterval(() => setTime(new Date()), 1000);
    const ch = supabase.channel("topbar-rt")
      .on("postgres_changes", { event:"*", schema:"public", table:"academy_settings" }, loadSettings)
      .subscribe();
    return () => { clearInterval(timer); supabase.removeChannel(ch); };
  }, [loadSettings, supabase]);

  const academyName = settings?.name ?? "أكاديمية العرض";
  const showTime    = settings?.display_show_time    !== false;
  const showWeather = settings?.display_show_weather !== false;

  return (
    <header style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"1vh 1.5vw",
      background:"rgba(255,255,255,0.06)",
      backdropFilter:"blur(20px)",
      borderRadius:"1.2vw",
      border:"1px solid rgba(255,255,255,0.12)",
      boxShadow:"0 8px 32px rgba(0,0,0,0.3)",
      flexShrink:0,
    }}>
      {/* Logo + Name */}
      <div style={{ display:"flex", alignItems:"center", gap:"1.2vw" }}>
        {settings?.logo_url ? (
          <Image
            src={settings.logo_url} alt={academyName}
            width={80} height={80}
            style={{ width:"5vw", height:"5vw", borderRadius:"50%", objectFit:"cover", boxShadow:"0 4px 20px rgba(37,99,235,0.4)" }}
          />
        ) : (
          <div style={{
            width:"5vw", height:"5vw", borderRadius:"50%",
            background:"linear-gradient(135deg,#2563eb,#7c3aed)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 20px rgba(37,99,235,0.4)",
            fontSize:"2.5vw", fontWeight:900, color:"#fff"
          }}>
            {academyName.charAt(0)}
          </div>
        )}
        <div>
          <h1 style={{ fontSize:"2.2vw", fontWeight:900, color:"#fff", lineHeight:1.1, margin:0 }}>{academyName}</h1>
          <p style={{ fontSize:"1vw", color:"rgba(147,197,253,0.8)", margin:0, fontWeight:500 }}>نظام إدارة العرض</p>
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:"1.5vw" }}>
        {/* Weather */}
        {showWeather && (
          <div style={{
            display:"flex", alignItems:"center", gap:"0.8vw",
            background:"rgba(255,255,255,0.06)", padding:"0.8vh 1.2vw",
            borderRadius:"1vw", border:"1px solid rgba(255,255,255,0.1)"
          }}>
            <Sun style={{ width:"2.5vw", height:"2.5vw", color:"#fbbf24" }} />
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"2vw", fontWeight:700, color:"#fff", lineHeight:1 }}>28°C</div>
              <div style={{ fontSize:"0.9vw", color:"#94a3b8" }}>مشمس</div>
            </div>
          </div>
        )}

        {/* Clock */}
        {showTime && (
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"flex-end",
            background:"linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))",
            padding:"0.8vh 1.5vw", borderRadius:"1.2vw",
            border:"1px solid rgba(255,255,255,0.15)",
            boxShadow:"0 8px 24px rgba(0,0,0,0.3)",
          }}>
            <div style={{ fontSize:"1.1vw", fontWeight:700, color:"#93c5fd", lineHeight:1 }}>
              {format(time, "EEEE", { locale: ar })}
            </div>
            <div style={{ fontSize:"0.9vw", color:"#94a3b8", marginBottom:"0.3vh" }}>
              {format(time, "dd MMMM yyyy", { locale: ar })}
            </div>
            <div style={{ fontSize:"3.8vw", fontWeight:900, color:"#fff", lineHeight:1, letterSpacing:"0.05em", direction:"ltr", display:"flex", alignItems:"baseline", gap:"0.5vw" }}>
              {format(time, "hh:mm:ss")}
              <span style={{ fontSize:"1.3vw", fontWeight:700, color:"#60a5fa" }}>{format(time, "a")}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
