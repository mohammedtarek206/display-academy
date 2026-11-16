"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AcademySettings } from "@/lib/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Sun, Cloud, CloudRain, Loader2 } from "lucide-react";
import Image from "next/image";

export default function TopBar() {
  const supabase = createClient();
  const [time, setTime] = useState(new Date());
  const [settings, setSettings] = useState<Partial<AcademySettings> | null>(null);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from("academy_settings").select("name,logo_url,display_show_time,display_show_weather").limit(1).single();
    setSettings(data);
  }, [supabase]);

  useEffect(() => {
    loadSettings();
    const timer = setInterval(() => setTime(new Date()), 1000);
    const ch = supabase.channel("topbar-settings-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "academy_settings" }, loadSettings)
      .subscribe();
    return () => { clearInterval(timer); supabase.removeChannel(ch); };
  }, [loadSettings, supabase]);

  const academyName = settings?.name ?? "أكاديمية العرض";
  const showTime = settings?.display_show_time !== false;
  const showWeather = settings?.display_show_weather !== false;

  return (
    <header className="glass-card flex items-center justify-between px-8 py-4 mb-6">
      {/* Logo + Name */}
      <div className="flex items-center gap-4">
        {settings?.logo_url ? (
          <Image src={settings.logo_url} alt={academyName} width={64} height={64} className="w-16 h-16 rounded-full object-cover shadow-lg" />
        ) : (
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50">
            <span className="text-2xl font-black text-white">{academyName.charAt(0)}</span>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{academyName}</h1>
          <p className="text-primary-300 font-medium text-sm opacity-80">Display Academy System</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Weather Widget */}
        {showWeather && (
          <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10">
            <Sun className="w-7 h-7 text-yellow-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-white">28°C</div>
              <div className="text-xs text-slate-300">مشمس</div>
            </div>
          </div>
        )}

        {/* Clock */}
        {showTime && (
          <div className="flex flex-col items-end bg-gradient-to-br from-white/10 to-white/5 px-7 py-3 rounded-3xl border border-white/20 shadow-xl backdrop-blur-lg">
            <div className="text-base font-bold text-primary-300">
              {format(time, "EEEE", { locale: ar })}
            </div>
            <div className="text-xs text-slate-300 mb-1">
              {format(time, "dd MMMM yyyy", { locale: ar })}
            </div>
            <div className="text-5xl font-black text-white tracking-wider flex items-baseline gap-2 font-sans" dir="ltr">
              {format(time, "hh:mm:ss")}
              <span className="text-xl font-bold text-primary-400 uppercase">{format(time, "a")}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
