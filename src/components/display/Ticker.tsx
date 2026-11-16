"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Announcement } from "@/lib/types";

export default function Ticker() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const load = useCallback(async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order("created_at");
    setAnnouncements(data ?? []);
  }, [supabase]);

  useEffect(() => {
    load();
    const ch = supabase.channel("ticker-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, supabase]);

  if (announcements.length === 0) return null;

  // Compute animation duration based on text length & speed
  const getSpeed = (speed: string) => {
    if (speed === "slow") return 40;
    if (speed === "fast") return 15;
    return 25;
  };

  const text = announcements.map(a => `• ${a.text}`).join("          ");
  const avgSpeed = getSpeed(announcements[0]?.speed ?? "normal");

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-primary/90 backdrop-blur-sm border-t border-primary/50 py-3 overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="shrink-0 px-4 bg-primary text-white text-sm font-black uppercase tracking-widest whitespace-nowrap border-l border-white/20">
          إعلانات
        </div>
        <div className="overflow-hidden flex-1">
          <span
            className="inline-block whitespace-nowrap text-white font-semibold text-sm animate-ticker"
            style={{ animationDuration: `${avgSpeed}s` }}
          >
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
          </span>
        </div>
      </div>
    </div>
  );
}
