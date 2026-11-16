"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Announcement } from "@/lib/types";

export default function Ticker() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const load = useCallback(async () => {
    const now = new Date().toISOString();
    const { data } = await supabase.from("announcements").select("*")
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order("created_at");
    setAnnouncements(data ?? []);
  }, [supabase]);

  useEffect(() => {
    load();
    const ch = supabase.channel("ticker-rt")
      .on("postgres_changes", { event:"*", schema:"public", table:"announcements" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, supabase]);

  if (announcements.length === 0) return null;

  const getSpeed = (s: string) => s === "slow" ? 50 : s === "fast" ? 20 : 32;
  const text = announcements.map(a => `❖  ${a.text}`).join("          ");
  const dur  = getSpeed(announcements[0]?.speed ?? "normal");

  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:50,
      background:"linear-gradient(90deg,#1d4ed8,#2563eb,#1d4ed8)",
      backdropFilter:"blur(8px)",
      borderTop:"1px solid rgba(255,255,255,0.15)",
      display:"flex", alignItems:"stretch",
      height:"6vh",
      boxShadow:"0 -4px 20px rgba(37,99,235,0.4)",
    }}>
      {/* Label */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"0 2vw",
        background:"rgba(0,0,0,0.25)",
        borderLeft:"1px solid rgba(255,255,255,0.15)",
        fontSize:"1.3vw", fontWeight:900, color:"#fff",
        letterSpacing:"0.1em", whiteSpace:"nowrap", flexShrink:0,
      }}>
        📢 إعلانات
      </div>

      {/* Scrolling text */}
      <div style={{ overflow:"hidden", flex:1, display:"flex", alignItems:"center" }}>
        <span
          className="animate-ticker"
          style={{
            display:"inline-block", whiteSpace:"nowrap",
            fontSize:"1.6vw", fontWeight:700, color:"#fff",
            animationDuration:`${dur}s`,
            textShadow:"0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </span>
      </div>
    </div>
  );
}
