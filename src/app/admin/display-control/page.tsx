"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AcademySettings } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";
import { Save, Loader2, Monitor, Eye, EyeOff, GripVertical } from "lucide-react";
import { motion } from "framer-motion";

const SECTIONS = [
  { key:"media", label:"الوسائط (صور + فيديو)" },
  { key:"rooms", label:"حالة القاعات" },
  { key:"announcements", label:"الإعلانات" },
  { key:"students", label:"الطلاب المتفوقون" },
];

export default function DisplayControlPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<Partial<AcademySettings>>({
    display_show_time: true, display_show_weather: true, display_show_announcements: true,
    display_show_videos: true, display_show_images: true, display_show_top_students: true,
    display_show_achievements: true,
    display_section_order: ["media","rooms","announcements","students"],
    display_section_durations: { media:10, rooms:15, announcements:8, students:12 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("academy_settings").select("*").limit(1).single();
    if (data) setSettings(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const S = (k: keyof AcademySettings, v: unknown) => setSettings(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("academy_settings").select("id").limit(1).single();
    if (existing?.id) {
      await supabase.from("academy_settings").update({ ...settings, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("academy_settings").insert(settings);
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const order = [...(settings.display_section_order ?? [])];
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    [order[idx], order[target]] = [order[target], order[idx]];
    S("display_section_order", order);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const toggleSwitch = (key: keyof AcademySettings, label: string, color="primary") => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={!!settings[key]} onChange={e=>S(key,e.target.checked)} className="sr-only peer" />
        <div className={`w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${color}-500`}></div>
      </label>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">التحكم في شاشة العرض</h2>
          <p className="text-slate-500 mt-1">تحكم في ما يظهر على الشاشات العامة</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${saved?"bg-emerald-500":"bg-primary hover:bg-primary/90"} shadow-lg disabled:opacity-70`}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Toggle Visibility */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Eye className="w-5 h-5 text-primary"/>إظهار وإخفاء العناصر</h3>
          <div className="space-y-3">
            {toggleSwitch("display_show_time", "الوقت والتاريخ")}
            {toggleSwitch("display_show_weather", "الطقس")}
            {toggleSwitch("display_show_announcements", "شريط الإعلانات","amber")}
            {toggleSwitch("display_show_videos", "الفيديوهات","rose")}
            {toggleSwitch("display_show_images", "الصور","emerald")}
            {toggleSwitch("display_show_top_students", "الطلاب المتفوقون","purple")}
            {toggleSwitch("display_show_achievements", "الإنجازات","cyan")}
          </div>
        </div>

        {/* Section Order + Duration */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Monitor className="w-5 h-5 text-primary"/>ترتيب الأقسام ومدة الظهور</h3>
          <div className="space-y-3">
            {(settings.display_section_order ?? []).map((secKey, idx) => {
              const sec = SECTIONS.find(s=>s.key===secKey);
              const dur = (settings.display_section_durations as Record<string,number>)?.[secKey] ?? 10;
              return (
                <div key={secKey} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center">{idx+1}</span>
                  <span className="flex-1 font-semibold text-sm text-slate-700 dark:text-slate-300">{sec?.label ?? secKey}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">المدة:</span>
                    <input type="number" min={5} max={120} value={dur}
                      onChange={e=>S("display_section_durations",{...(settings.display_section_durations as Record<string,number>),[secKey]:Number(e.target.value)})}
                      className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center focus:outline-none" />
                    <span className="text-xs text-slate-400">ث</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={()=>moveSection(idx,-1)} disabled={idx===0} className="px-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-xs">▲</button>
                    <button onClick={()=>moveSection(idx,1)} disabled={idx===(settings.display_section_order??[]).length-1} className="px-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-xs">▼</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
